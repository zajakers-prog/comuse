import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { created, unauthorized, notFound, error } from "@/lib/api-response";
import { countWords } from "@/lib/utils";
import { SegmentType } from "@prisma/client";
import {
  analyzeSegment,
  calculateContributionShares,
} from "@/lib/contribution-analyzer";

const CreateSegmentSchema = z.object({
  branchId: z.string().uuid(),
  title: z.string().max(200).optional(),
  body: z.string().min(1),
  type: z.nativeEnum(SegmentType).default("BODY"),
});

// POST /api/segments - 새 Segment(기여) 작성
export async function POST(req: NextRequest) {
  const payload = getUserFromRequest(req);
  if (!payload) return unauthorized();

  try {
    const body = await req.json();
    const parsed = CreateSegmentSchema.safeParse(body);
    if (!parsed.success) {
      return error(parsed.error.errors.map((e) => e.message).join(", "));
    }

    const { branchId, title, body: segBody, type } = parsed.data;

    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      include: {
        work: true,
        segments: { orderBy: { order: "asc" } },
      },
    });
    if (!branch) return notFound("브랜치를 찾을 수 없습니다");

    const nextOrder = branch.segments.length + 1;
    const wc = countWords(segBody);

    // Segment 생성
    const segment = await prisma.segment.create({
      data: {
        branchId,
        authorId: payload.userId,
        title: title ?? null,
        body: segBody,
        type,
        order: nextOrder,
        wordCount: wc,
      },
      include: {
        author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
    });

    // AI 분석 및 기여도 재계산 (백그라운드)
    void analyzeAndUpdateContributions(segment.id, branch.workId, {
      workTitle: branch.work.title,
      workGenre: branch.work.genre,
      workLogline: branch.work.logline,
      previousSegments: branch.segments.map((s) => ({
        title: s.title,
        body: s.body,
        authorId: s.authorId,
      })),
      totalSegmentsInWork: nextOrder,
    });

    return created(segment);
  } catch (err) {
    console.error(err);
    return error("서버 오류", 500);
  }
}

async function analyzeAndUpdateContributions(
  segmentId: string,
  workId: string,
  context: {
    workTitle: string;
    workGenre: string;
    workLogline: string;
    previousSegments: Array<{ title?: string | null; body: string; authorId: string }>;
    totalSegmentsInWork: number;
  }
) {
  try {
    const segment = await prisma.segment.findUnique({ where: { id: segmentId } });
    if (!segment) return;

    // 1. AI 분석
    const aiResult = await analyzeSegment({
      segmentId,
      title: segment.title,
      body: segment.body,
      type: segment.type,
      wordCount: segment.wordCount,
      branchContext: context,
    });

    await prisma.segmentAIScore.upsert({
      where: { segmentId },
      create: {
        segmentId,
        originalityScore: aiResult.originalityScore,
        coherenceScore: aiResult.coherenceScore,
        qualityScore: aiResult.qualityScore,
        impactScore: aiResult.impactScore,
        roleWeight: aiResult.roleWeight,
        rawAnalysis: aiResult.rawAnalysis,
      },
      update: {
        originalityScore: aiResult.originalityScore,
        coherenceScore: aiResult.coherenceScore,
        qualityScore: aiResult.qualityScore,
        impactScore: aiResult.impactScore,
        roleWeight: aiResult.roleWeight,
        rawAnalysis: aiResult.rawAnalysis,
      },
    });

    // 2. 작품 전체 모든 브랜치의 Segment를 가져와 기여도 재계산
    const allSegments = await prisma.segment.findMany({
      where: { branch: { workId } },
      include: { aiScore: true },
    });

    const shares = calculateContributionShares(allSegments);

    // 3. ContributionScore 업데이트 (upsert)
    for (const share of shares) {
      const userSegs = allSegments.filter((s) => s.authorId === share.userId);
      await prisma.contributionScore.upsert({
        where: { userId_workId: { userId: share.userId, workId } },
        create: {
          userId: share.userId,
          workId,
          percentage: share.percentage,
          segmentCount: share.segmentCount,
          totalWords: share.totalWords,
          lastCalculated: new Date(),
        },
        update: {
          percentage: share.percentage,
          segmentCount: userSegs.length,
          totalWords: userSegs.reduce((s, seg) => s + seg.wordCount, 0),
          lastCalculated: new Date(),
        },
      });
    }
  } catch (err) {
    console.error("기여도 계산 오류:", err);
  }
}

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, notFound } from "@/lib/api-response";

// GET /api/contributions/:workId - 작품의 기여도 현황
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ workId: string }> }
) {
  const { workId } = await params;

  const work = await prisma.work.findUnique({ where: { id: workId } });
  if (!work) return notFound("작품을 찾을 수 없습니다");

  const contributions = await prisma.contributionScore.findMany({
    where: { workId },
    orderBy: { percentage: "desc" },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          ethAddress: true,
        },
      },
    },
  });

  // 브랜치별 Segment 상세 내역
  const segments = await prisma.segment.findMany({
    where: { branch: { workId } },
    orderBy: [{ branch: { createdAt: "asc" } }, { order: "asc" }],
    include: {
      author: { select: { id: true, username: true, displayName: true } },
      branch: { select: { id: true, name: true } },
      aiScore: true,
    },
  });

  return ok({
    workId,
    workTitle: work.title,
    contributions,
    segments,
    lastUpdated: contributions[0]?.lastCalculated ?? null,
  });
}

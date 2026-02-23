import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { ok, created, unauthorized, error } from "@/lib/api-response";
import { paginate } from "@/lib/utils";
import { WorkGenre, WorkStatus } from "@prisma/client";

const CreateWorkSchema = z.object({
  title: z.string().min(1).max(200),
  logline: z.string().min(1).max(500),
  description: z.string().optional(),
  genre: z.nativeEnum(WorkGenre),
  tags: z.array(z.string()).max(10).default([]),
});

// GET /api/works - 작품 목록
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const genre = searchParams.get("genre") as WorkGenre | null;
  const status = searchParams.get("status") as WorkStatus | null;
  const featured = searchParams.get("featured") === "true";
  const q = searchParams.get("q");

  const where = {
    ...(genre && { genre }),
    ...(status && { status }),
    ...(featured && { isFeatured: true }),
    ...(q && {
      OR: [
        { title: { contains: q, mode: "insensitive" as const } },
        { logline: { contains: q, mode: "insensitive" as const } },
        { tags: { has: q } },
      ],
    }),
  };

  const { skip, take } = paginate(page, limit);
  const [works, total] = await Promise.all([
    prisma.work.findMany({
      where,
      skip,
      take,
      orderBy: [{ isFeatured: "desc" }, { views: "desc" }, { createdAt: "desc" }],
      include: {
        author: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
        _count: {
          select: { branches: true, contributions: true, likes: true, comments: true },
        },
      },
    }),
    prisma.work.count({ where }),
  ]);

  return ok({ works, total, page, limit, totalPages: Math.ceil(total / limit) });
}

// POST /api/works - 새 작품 생성
export async function POST(req: NextRequest) {
  const payload = getUserFromRequest(req);
  if (!payload) return unauthorized();

  try {
    const body = await req.json();
    const parsed = CreateWorkSchema.safeParse(body);
    if (!parsed.success) {
      return error(parsed.error.errors.map((e) => e.message).join(", "));
    }

    const { title, logline, description, genre, tags } = parsed.data;

    // 트랜잭션: Work 생성 + 메인 브랜치 자동 생성
    const work = await prisma.$transaction(async (tx) => {
      const newWork = await tx.work.create({
        data: {
          title,
          logline,
          description,
          genre,
          tags,
          authorId: payload.userId,
        },
      });

      const mainBranch = await tx.branch.create({
        data: {
          name: "main",
          description: "메인 브랜치",
          workId: newWork.id,
          creatorId: payload.userId,
        },
      });

      // 작품의 초기 기여도 등록 (아이디어 제공자)
      await tx.contributionScore.create({
        data: {
          userId: payload.userId,
          workId: newWork.id,
          percentage: 100, // 처음엔 100%, 기여자 추가될 때마다 재계산
          segmentCount: 0,
          totalWords: 0,
        },
      });

      return tx.work.update({
        where: { id: newWork.id },
        data: { mainBranchId: mainBranch.id },
        include: {
          author: {
            select: { id: true, username: true, displayName: true },
          },
          mainBranch: true,
        },
      });
    });

    return created(work);
  } catch (err) {
    console.error(err);
    return error("서버 오류", 500);
  }
}

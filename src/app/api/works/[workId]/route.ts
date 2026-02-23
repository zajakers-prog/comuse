import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { ok, notFound, forbidden, error } from "@/lib/api-response";

// GET /api/works/:workId
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ workId: string }> }
) {
  const { workId } = await params;

  const work = await prisma.work.findUnique({
    where: { id: workId },
    include: {
      author: {
        select: { id: true, username: true, displayName: true, avatarUrl: true },
      },
      mainBranch: {
        include: {
          segments: {
            orderBy: { order: "asc" },
            include: {
              author: {
                select: { id: true, username: true, displayName: true, avatarUrl: true },
              },
              aiScore: true,
              forkedBranches: {
                select: { id: true, name: true, creatorId: true, likes: true },
              },
            },
          },
        },
      },
      branches: {
        where: { parentBranchId: { not: null } },
        orderBy: { likes: "desc" },
        include: {
          creator: {
            select: { id: true, username: true, displayName: true },
          },
          _count: { select: { segments: true, childBranches: true } },
        },
      },
      contributions: {
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
      },
      _count: {
        select: { likes: true, comments: true },
      },
    },
  });

  if (!work) return notFound("작품을 찾을 수 없습니다");

  // 조회수 증가 (비동기, 응답 후)
  prisma.work
    .update({ where: { id: workId }, data: { views: { increment: 1 } } })
    .catch(() => {});

  return ok(work);
}

// PATCH /api/works/:workId - 작품 정보 수정 (작성자만)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ workId: string }> }
) {
  const { workId } = await params;
  const payload = getUserFromRequest(req);
  if (!payload) {
    return error("Unauthorized", 401);
  }

  const work = await prisma.work.findUnique({ where: { id: workId } });
  if (!work) return notFound();
  if (work.authorId !== payload.userId && payload.role !== "ADMIN") {
    return forbidden("수정 권한이 없습니다");
  }

  const body = await req.json();
  const { title, logline, description, tags, status } = body;

  const updated = await prisma.work.update({
    where: { id: workId },
    data: {
      ...(title && { title }),
      ...(logline && { logline }),
      ...(description !== undefined && { description }),
      ...(tags && { tags }),
      ...(status && { status }),
    },
  });

  return ok(updated);
}

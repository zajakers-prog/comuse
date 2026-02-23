import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { ok, unauthorized } from "@/lib/api-response";

// POST = 토글 (좋아요/취소)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ workId: string }> }
) {
  const payload = getUserFromRequest(req);
  if (!payload) return unauthorized();
  const { workId } = await params;

  const existing = await prisma.workLike.findUnique({
    where: { userId_workId: { userId: payload.userId, workId } },
  });

  if (existing) {
    await prisma.workLike.delete({ where: { id: existing.id } });
    return ok({ liked: false });
  } else {
    await prisma.workLike.create({ data: { userId: payload.userId, workId } });
    return ok({ liked: true });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ workId: string }> }
) {
  const payload = getUserFromRequest(req);
  const { workId } = await params;
  const [count, liked] = await Promise.all([
    prisma.workLike.count({ where: { workId } }),
    payload
      ? prisma.workLike.findUnique({ where: { userId_workId: { userId: payload.userId, workId } } })
      : null,
  ]);
  return ok({ count, liked: !!liked });
}

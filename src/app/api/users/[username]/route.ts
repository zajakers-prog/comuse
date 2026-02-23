import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, notFound } from "@/lib/api-response";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true, username: true, displayName: true, bio: true,
      avatarUrl: true, ethAddress: true, createdAt: true,
      _count: { select: { followers: true, following: true, segmentsWritten: true } },
      worksAuthored: {
        orderBy: { createdAt: "desc" }, take: 10,
        select: {
          id: true, title: true, logline: true, genre: true, status: true,
          views: true, tags: true,
          _count: { select: { likes: true, branches: true } },
        },
      },
      contributions: {
        orderBy: { percentage: "desc" }, take: 10,
        include: {
          work: { select: { id: true, title: true, genre: true, status: true } },
        },
      },
    },
  });
  if (!user) return notFound("사용자를 찾을 수 없습니다");
  return ok(user);
}

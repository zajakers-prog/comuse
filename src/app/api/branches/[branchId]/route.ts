import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, notFound } from "@/lib/api-response";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ branchId: string }> }
) {
  const { branchId } = await params;

  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    include: {
      segments: {
        orderBy: { order: "asc" },
        include: {
          author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          aiScore: true,
          forkedBranches: { select: { id: true, name: true, creatorId: true, likes: true } },
        },
      },
    },
  });

  if (!branch) return notFound("브랜치를 찾을 수 없습니다");
  return ok(branch);
}

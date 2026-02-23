import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { ok, unauthorized } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const payload = getUserFromRequest(req);
  if (!payload) return unauthorized();

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      bio: true,
      avatarUrl: true,
      ethAddress: true,
      role: true,
      isPremium: true,
      createdAt: true,
      _count: {
        select: {
          worksAuthored: true,
          segmentsWritten: true,
          followers: true,
          following: true,
        },
      },
    },
  });

  if (!user) return unauthorized();
  return ok(user);
}

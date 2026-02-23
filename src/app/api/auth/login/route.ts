import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { comparePassword, signToken } from "@/lib/auth";
import { ok, error } from "@/lib/api-response";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return error("이메일과 비밀번호를 입력해주세요");
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return error("이메일 또는 비밀번호가 올바르지 않습니다", 401);
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      return error("이메일 또는 비밀번호가 올바르지 않습니다", 401);
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    return ok({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        ethAddress: user.ethAddress,
        role: user.role,
        isPremium: user.isPremium,
      },
    });
  } catch (err) {
    console.error(err);
    return error("서버 오류", 500);
  }
}

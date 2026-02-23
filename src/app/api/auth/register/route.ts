import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken } from "@/lib/auth";
import { created, error } from "@/lib/api-response";

const RegisterSchema = z.object({
  email: z.string().email(),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/),
  displayName: z.string().min(1).max(50),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return error(parsed.error.errors.map((e) => e.message).join(", "));
    }

    const { email, username, displayName, password } = parsed.data;

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existing) {
      return error(
        existing.email === email
          ? "이미 사용 중인 이메일입니다"
          : "이미 사용 중인 사용자명입니다"
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, username, displayName, passwordHash },
    });

    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    return created({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    return error("서버 오류", 500);
  }
}

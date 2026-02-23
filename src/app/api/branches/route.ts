import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { ok, created, unauthorized, notFound, error } from "@/lib/api-response";

const CreateBranchSchema = z.object({
  workId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  // 어느 브랜치의 어느 segment 이후 지점에서 분기할지
  parentBranchId: z.string().uuid().optional(),
  forkedAfterSegmentId: z.string().uuid().optional(),
});

// POST /api/branches - 새 브랜치(가지) 생성
export async function POST(req: NextRequest) {
  const payload = getUserFromRequest(req);
  if (!payload) return unauthorized();

  try {
    const body = await req.json();
    const parsed = CreateBranchSchema.safeParse(body);
    if (!parsed.success) {
      return error(parsed.error.errors.map((e) => e.message).join(", "));
    }

    const { workId, name, description, parentBranchId, forkedAfterSegmentId } =
      parsed.data;

    const work = await prisma.work.findUnique({ where: { id: workId } });
    if (!work) return notFound("작품을 찾을 수 없습니다");

    // 분기 지점의 segment가 실제로 해당 브랜치에 속하는지 검증
    if (forkedAfterSegmentId && parentBranchId) {
      const seg = await prisma.segment.findFirst({
        where: { id: forkedAfterSegmentId, branchId: parentBranchId },
      });
      if (!seg) return error("분기 지점의 Segment가 유효하지 않습니다");
    }

    const branch = await prisma.branch.create({
      data: {
        name,
        description,
        workId,
        creatorId: payload.userId,
        parentBranchId: parentBranchId ?? null,
        forkedAfterSegmentId: forkedAfterSegmentId ?? null,
      },
      include: {
        creator: { select: { id: true, username: true, displayName: true } },
        parentBranch: { select: { id: true, name: true } },
        forkedAfterSegment: { select: { id: true, title: true, order: true } },
      },
    });

    return created(branch);
  } catch (err) {
    console.error(err);
    return error("서버 오류", 500);
  }
}

// GET /api/branches?workId=xxx - 작품의 전체 브랜치 트리
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const workId = searchParams.get("workId");
  if (!workId) return error("workId가 필요합니다");

  const branches = await prisma.branch.findMany({
    where: { workId },
    orderBy: { createdAt: "asc" },
    include: {
      creator: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      _count: { select: { segments: true, childBranches: true } },
      forkedAfterSegment: { select: { id: true, title: true, order: true } },
    },
  });

  // 트리 구조로 변환
  const tree = buildBranchTree(branches);
  return ok(tree);
}

type BranchWithMeta = {
  id: string;
  name: string;
  description: string | null;
  parentBranchId: string | null;
  forkedAfterSegmentId: string | null;
  creatorId: string;
  likes: number;
  status: string;
  createdAt: Date;
  creator: { id: string; username: string; displayName: string; avatarUrl: string | null };
  _count: { segments: number; childBranches: number };
  forkedAfterSegment: { id: string; title: string | null; order: number } | null;
  children?: BranchWithMeta[];
};

function buildBranchTree(branches: BranchWithMeta[]): BranchWithMeta[] {
  const map = new Map<string, BranchWithMeta & { children: BranchWithMeta[] }>();
  const roots: (BranchWithMeta & { children: BranchWithMeta[] })[] = [];

  for (const b of branches) {
    map.set(b.id, { ...b, children: [] });
  }

  for (const b of Array.from(map.values())) {
    if (b.parentBranchId) {
      const parent = map.get(b.parentBranchId);
      if (parent) parent.children.push(b);
    } else {
      roots.push(b);
    }
  }

  return roots;
}

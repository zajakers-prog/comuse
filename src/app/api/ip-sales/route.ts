import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { created, unauthorized, notFound, forbidden, error } from "@/lib/api-response";
import {
  depositRevenueOnChain,
  registerSharesOnChain,
} from "@/lib/ethereum/contract";

const IPSaleSchema = z.object({
  workId: z.string().uuid(),
  buyerName: z.string().min(1),
  saleAmount: z.number().positive(),
  currency: z.string().default("ETH"),
});

// POST /api/ip-sales - IP 판매 등록 및 수익 배분 시작
export async function POST(req: NextRequest) {
  const payload = getUserFromRequest(req);
  if (!payload) return unauthorized();

  try {
    const body = await req.json();
    const parsed = IPSaleSchema.safeParse(body);
    if (!parsed.success) {
      return error(parsed.error.errors.map((e) => e.message).join(", "));
    }

    const { workId, buyerName, saleAmount, currency } = parsed.data;

    const work = await prisma.work.findUnique({
      where: { id: workId },
      include: {
        contributions: {
          include: { user: true },
        },
        ipSale: true,
      },
    });

    if (!work) return notFound("작품을 찾을 수 없습니다");
    if (work.authorId !== payload.userId && payload.role !== "ADMIN") {
      return forbidden("IP 판매 권한이 없습니다");
    }
    if (work.ipSale) {
      return error("이미 판매된 작품입니다");
    }

    // 1. IP Sale 레코드 생성
    const ipSale = await prisma.iPSale.create({
      data: {
        workId,
        buyerName,
        saleAmount,
        currency,
        status: "PENDING",
      },
    });

    // 2. 이더리움 컨트랙트에 수익 배분 비율 등록
    if (currency === "ETH" && work.contributions.length > 0) {
      const ethAddresses: Record<string, string> = {};
      for (const c of work.contributions) {
        if (c.user.ethAddress) {
          ethAddresses[c.userId] = c.user.ethAddress;
        }
      }

      const shares = work.contributions.map((c) => ({
        userId: c.userId,
        percentage: c.percentage,
        segmentCount: c.segmentCount,
        totalWords: c.totalWords,
      }));

      try {
        const result = await registerSharesOnChain(workId, shares, ethAddresses);

        // 3. 수익 예치
        const txHash = await depositRevenueOnChain(workId, saleAmount.toString());

        // 4. 레코드 업데이트
        await prisma.iPSale.update({
          where: { id: ipSale.id },
          data: {
            txHash,
            contractAddress: result.contractAddress,
            status: "DISTRIBUTED",
          },
        });

        // 5. RevenueShare 레코드 생성
        for (const contrib of work.contributions) {
          if (contrib.user.ethAddress) {
            await prisma.revenueShare.create({
              data: {
                userId: contrib.userId,
                ipSaleId: ipSale.id,
                contributionId: contrib.id,
                percentage: contrib.percentage,
                amountEth: (saleAmount * contrib.percentage) / 100,
                status: "SENT",
              },
            });
          }
        }
      } catch (chainErr) {
        console.error("온체인 배분 오류:", chainErr);
        // 블록체인 오류는 오프체인 레코드는 유지하고 DISPUTED 처리
        await prisma.iPSale.update({
          where: { id: ipSale.id },
          data: { status: "DISPUTED" },
        });
      }
    }

    // 6. 작품 상태를 SOLD로 변경
    await prisma.work.update({
      where: { id: workId },
      data: { status: "SOLD" },
    });

    return created({ ipSaleId: ipSale.id, workId, status: "완료" });
  } catch (err) {
    console.error(err);
    return error("서버 오류", 500);
  }
}

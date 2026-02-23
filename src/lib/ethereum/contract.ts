/**
 * CoMuse 이더리움 컨트랙트 연동 모듈
 * - IP 판매 수익 예치
 * - 기여자별 배분 비율 설정 (AI 분석 결과 기반)
 * - 기여자 수령 트랜잭션 실행
 */

import { ethers } from "ethers";
import { ContributorShare } from "@/lib/contribution-analyzer";

// ABI (CoMuseRevenue.sol의 핵심 함수들)
const CONTRACT_ABI = [
  "function depositRevenue(string calldata workId) external payable",
  "function setShares(string calldata workId, address[] calldata contributors, uint256[] calldata shareBps) external",
  "function claim(string calldata workId) external",
  "function getWorkRevenue(string calldata workId) external view returns (uint256, address[], uint256[], uint256[])",
  "function withdrawPlatformFee(string calldata workId) external",
  "event RevenueDeposited(bytes32 indexed workHash, string workId, uint256 amount)",
  "event SharesSet(bytes32 indexed workHash, address[] contributors, uint256[] shareBps)",
  "event Claimed(bytes32 indexed workHash, address contributor, uint256 amount)",
];

function getProvider() {
  const rpcUrl = process.env.ETHEREUM_RPC_URL;
  if (!rpcUrl) throw new Error("ETHEREUM_RPC_URL not configured");
  return new ethers.JsonRpcProvider(rpcUrl);
}

function getPlatformSigner() {
  const privateKey = process.env.PLATFORM_WALLET_PRIVATE_KEY;
  if (!privateKey) throw new Error("PLATFORM_WALLET_PRIVATE_KEY not configured");
  return new ethers.Wallet(privateKey, getProvider());
}

function getContract(signerOrProvider?: ethers.Signer | ethers.Provider) {
  const contractAddress = process.env.REVENUE_CONTRACT_ADDRESS;
  if (!contractAddress) throw new Error("REVENUE_CONTRACT_ADDRESS not configured");
  const base = signerOrProvider ?? getProvider();
  return new ethers.Contract(contractAddress, CONTRACT_ABI, base);
}

export interface SetSharesResult {
  txHash: string;
  contractAddress: string;
}

/**
 * AI 분석 결과를 컨트랙트에 등록
 * 배분 비율 = 90% (플랫폼 10% 수수료 제외)
 */
export async function registerSharesOnChain(
  workId: string,
  shares: ContributorShare[],
  ethAddresses: Record<string, string> // userId → ethAddress
): Promise<SetSharesResult> {
  const signer = getPlatformSigner();
  const contract = getContract(signer);

  const PLATFORM_FEE_BPS = 1000; // 10%
  const DISTRIBUTABLE_BPS = 10000 - PLATFORM_FEE_BPS; // 9000

  const contributors: string[] = [];
  const shareBps: bigint[] = [];

  let totalBps = 0;
  for (const share of shares) {
    const addr = ethAddresses[share.userId];
    if (!addr) continue;
    const bps = Math.round((share.percentage / 100) * DISTRIBUTABLE_BPS);
    contributors.push(addr);
    shareBps.push(BigInt(bps));
    totalBps += bps;
  }

  // 부동소수점 오차 보정
  if (contributors.length > 0 && totalBps !== DISTRIBUTABLE_BPS) {
    shareBps[0] += BigInt(DISTRIBUTABLE_BPS - totalBps);
  }

  const tx = await contract.setShares(workId, contributors, shareBps);
  await tx.wait();

  return {
    txHash: tx.hash,
    contractAddress: await contract.getAddress(),
  };
}

/**
 * IP 판매 수익을 컨트랙트에 예치
 */
export async function depositRevenueOnChain(
  workId: string,
  amountEth: string
): Promise<string> {
  const signer = getPlatformSigner();
  const contract = getContract(signer);

  const tx = await contract.depositRevenue(workId, {
    value: ethers.parseEther(amountEth),
  });
  await tx.wait();
  return tx.hash;
}

/**
 * 작품의 온체인 수익 정보 조회
 */
export async function getOnChainRevenue(workId: string) {
  const contract = getContract();
  const [totalAmount, contributors, shareBps, claimed] =
    await contract.getWorkRevenue(workId);

  return {
    totalAmountEth: ethers.formatEther(totalAmount),
    contributors: (contributors as string[]).map((addr: string, i: number) => ({
      address: addr,
      shareBps: Number(shareBps[i]),
      sharePercent: Number(shareBps[i]) / 100,
      claimedEth: ethers.formatEther(claimed[i]),
    })),
  };
}

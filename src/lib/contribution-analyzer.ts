/**
 * CoMuse 기여도 분석 엔진
 * Claude API를 사용해 각 Segment의 창작 기여도를 분석하고
 * 작품 전체에서 각 기여자의 수익 배분 비율을 계산한다.
 *
 * 분석 기준:
 * - originalityScore: 독창성 (아이디어의 새로움)
 * - coherenceScore: 연결성 (앞뒤 흐름과의 자연스러운 연결)
 * - qualityScore: 품질 (문장 완성도, 표현력)
 * - impactScore: 영향도 (후속 기여자들이 이 부분에 얼마나 의존하는지)
 * - roleWeight: 역할 가중치 (아이디어 제공자 vs 집필자 vs 마무리 등)
 */

import Anthropic from "@anthropic-ai/sdk";
import { SegmentType } from "@prisma/client";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface SegmentAnalysisInput {
  segmentId: string;
  title?: string | null;
  body: string;
  type: SegmentType;
  wordCount: number;
  branchContext: {
    workTitle: string;
    workGenre: string;
    workLogline: string;
    previousSegments: Array<{ title?: string | null; body: string; authorId: string }>;
    totalSegmentsInWork: number;
  };
}

export interface SegmentAnalysisResult {
  segmentId: string;
  originalityScore: number;
  coherenceScore: number;
  qualityScore: number;
  impactScore: number;
  roleWeight: number;
  rawAnalysis: string;
}

// 역할별 기본 가중치
const ROLE_BASE_WEIGHTS: Record<SegmentType, number> = {
  IDEA: 1.5,    // 소재/아이디어 제공자는 높은 가중치
  OPENING: 1.3, // 도입부 설정자
  BODY: 1.0,
  CLIMAX: 1.2,
  ENDING: 1.1,
};

export async function analyzeSegment(
  input: SegmentAnalysisInput
): Promise<SegmentAnalysisResult> {
  const { segmentId, title, body, type, branchContext } = input;
  const { workTitle, workGenre, workLogline, previousSegments } = branchContext;

  const prevContext =
    previousSegments.length > 0
      ? previousSegments
          .slice(-3) // 최근 3개 세그먼트만 컨텍스트로 활용
          .map((s, i) => `[이전 ${i + 1}] ${s.title ?? ""}\n${s.body}`)
          .join("\n\n---\n\n")
      : "없음 (첫 번째 기여)";

  const prompt = `당신은 공동창작 플랫폼의 기여도 분석 전문가입니다.
아래 작품에서 특정 기여(Segment)를 분석하고, 각 항목을 0.00~1.00 사이의 점수로 평가해주세요.

## 작품 정보
- 제목: ${workTitle}
- 장르: ${workGenre}
- 핵심 소재: ${workLogline}

## 이전 내용 (컨텍스트)
${prevContext}

## 분석할 기여 내용
- 역할 유형: ${type}
- 제목: ${title ?? "(제목 없음)"}
- 내용:
${body}

## 평가 항목 (각 0.00~1.00)
1. originalityScore: 이 기여의 독창성. 기존 컨텍스트와 얼마나 새롭고 창의적인가?
2. coherenceScore: 이전 내용과의 연결성. 자연스럽게 이어지는가?
3. qualityScore: 글 자체의 품질. 문장, 표현, 완성도.
4. impactScore: 이 기여가 작품 전체 방향에 미치는 영향. 이 내용 없이 작품이 성립 가능한가?

## 응답 형식 (JSON만 반환, 다른 텍스트 없이)
{
  "originalityScore": 0.00,
  "coherenceScore": 0.00,
  "qualityScore": 0.00,
  "impactScore": 0.00,
  "reasoning": "간단한 분석 이유 (한국어, 2-3문장)"
}`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "{}";

    // JSON 파싱
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    const originalityScore = clamp(parsed.originalityScore ?? 0.5);
    const coherenceScore = clamp(parsed.coherenceScore ?? 0.5);
    const qualityScore = clamp(parsed.qualityScore ?? 0.5);
    const impactScore = clamp(parsed.impactScore ?? 0.5);
    const roleWeight = ROLE_BASE_WEIGHTS[type] ?? 1.0;

    return {
      segmentId,
      originalityScore,
      coherenceScore,
      qualityScore,
      impactScore,
      roleWeight,
      rawAnalysis: parsed.reasoning ?? responseText,
    };
  } catch (err) {
    console.error("AI 분석 오류:", err);
    // 폴백: 기본값 반환
    return {
      segmentId,
      originalityScore: 0.5,
      coherenceScore: 0.5,
      qualityScore: 0.5,
      impactScore: 0.5,
      roleWeight: ROLE_BASE_WEIGHTS[type] ?? 1.0,
      rawAnalysis: "AI 분석 실패 - 기본값 사용",
    };
  }
}

function clamp(val: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, val));
}

/**
 * 작품 전체 기여도를 재계산한다.
 * 각 Segment의 AI 점수를 종합해서 userId별 기여 비율(%)을 반환한다.
 */
export interface ContributorShare {
  userId: string;
  percentage: number;
  segmentCount: number;
  totalWords: number;
}

export interface SegmentForCalculation {
  id: string;
  authorId: string;
  wordCount: number;
  type: SegmentType;
  aiScore: {
    originalityScore: number;
    coherenceScore: number;
    qualityScore: number;
    impactScore: number;
    roleWeight: number;
  } | null;
}

export function calculateContributionShares(
  segments: SegmentForCalculation[]
): ContributorShare[] {
  if (segments.length === 0) return [];

  // 각 Segment의 종합 점수 계산
  const segmentScores = segments.map((seg) => {
    const ai = seg.aiScore;
    let score: number;

    if (ai) {
      // 가중 평균: 독창성(30%) + 품질(25%) + 영향도(30%) + 연결성(15%)
      const baseScore =
        ai.originalityScore * 0.3 +
        ai.qualityScore * 0.25 +
        ai.impactScore * 0.3 +
        ai.coherenceScore * 0.15;

      // 역할 가중치 및 분량 가중치 반영
      const wordFactor = Math.log1p(seg.wordCount) / Math.log1p(1000); // 1000자 기준 정규화
      score = baseScore * ai.roleWeight * (0.7 + 0.3 * wordFactor);
    } else {
      // AI 점수 없을 때: 분량 기반 기본 점수
      score = Math.log1p(seg.wordCount) / Math.log1p(1000);
    }

    return { authorId: seg.authorId, score, wordCount: seg.wordCount };
  });

  // userId별 집계
  const userMap = new Map<
    string,
    { totalScore: number; segmentCount: number; totalWords: number }
  >();

  for (const s of segmentScores) {
    const existing = userMap.get(s.authorId) ?? {
      totalScore: 0,
      segmentCount: 0,
      totalWords: 0,
    };
    userMap.set(s.authorId, {
      totalScore: existing.totalScore + s.score,
      segmentCount: existing.segmentCount + 1,
      totalWords: existing.totalWords + s.wordCount,
    });
  }

  const totalScore = Array.from(userMap.values()).reduce(
    (sum, u) => sum + u.totalScore,
    0
  );

  const shares: ContributorShare[] = Array.from(userMap.entries()).map(
    ([userId, data]) => ({
      userId,
      percentage:
        totalScore > 0
          ? Math.round((data.totalScore / totalScore) * 10000) / 100
          : 100 / userMap.size,
      segmentCount: data.segmentCount,
      totalWords: data.totalWords,
    })
  );

  // 합계가 100%가 되도록 보정 (부동소수점 오차)
  const total = shares.reduce((s, c) => s + c.percentage, 0);
  if (shares.length > 0 && Math.abs(total - 100) > 0.01) {
    shares[0].percentage += 100 - total;
    shares[0].percentage = Math.round(shares[0].percentage * 100) / 100;
  }

  return shares.sort((a, b) => b.percentage - a.percentage);
}

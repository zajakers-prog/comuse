"use client";

interface ContributionChartProps {
  contributions: Array<{
    userId: string;
    percentage: number;
    segmentCount: number;
    totalWords: number;
    user: {
      id: string;
      username: string;
      displayName: string;
      avatarUrl?: string | null;
      ethAddress?: string | null;
    };
  }>;
}

const COLORS = [
  "bg-violet-500",
  "bg-blue-500",
  "bg-green-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-teal-500",
  "bg-red-500",
  "bg-indigo-500",
];

const TEXT_COLORS = [
  "text-violet-600",
  "text-blue-600",
  "text-green-600",
  "text-orange-600",
  "text-pink-600",
  "text-teal-600",
  "text-red-600",
  "text-indigo-600",
];

export function ContributionChart({ contributions }: ContributionChartProps) {
  if (contributions.length === 0) {
    return <p className="text-gray-400 text-sm">기여자가 없습니다</p>;
  }

  return (
    <div className="space-y-4">
      {/* 막대 차트 */}
      <div className="flex h-4 rounded-full overflow-hidden gap-0.5">
        {contributions.map((c, i) => (
          <div
            key={c.userId}
            className={COLORS[i % COLORS.length]}
            style={{ width: `${c.percentage}%` }}
            title={`${c.user.displayName}: ${c.percentage}%`}
          />
        ))}
      </div>

      {/* 범례 */}
      <div className="space-y-2">
        {contributions.map((c, i) => (
          <div key={c.userId} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${COLORS[i % COLORS.length]}`}
              />
              <span className="text-sm text-gray-700">{c.user.displayName}</span>
              <span className="text-xs text-gray-400">@{c.user.username}</span>
              {c.user.ethAddress && (
                <span className="text-xs text-gray-400 font-mono">
                  {c.user.ethAddress.slice(0, 6)}…{c.user.ethAddress.slice(-4)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-400 text-xs">
                {c.segmentCount}편 · {c.totalWords.toLocaleString()}자
              </span>
              <span className={`font-bold ${TEXT_COLORS[i % TEXT_COLORS.length]}`}>
                {c.percentage.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400">
        * AI가 독창성, 품질, 영향도, 연결성을 분석해 자동 계산됩니다.
        IP 판매 시 이 비율대로 이더리움 스마트 컨트랙트를 통해 배분됩니다.
      </p>
    </div>
  );
}

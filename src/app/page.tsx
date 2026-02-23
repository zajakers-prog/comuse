import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="overflow-hidden">
      {/* 히어로 섹션 */}
      <section className="relative bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-28">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-violet-50 border border-violet-100 rounded-full px-4 py-1.5 text-sm text-violet-700 font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
              소재 제공자 · 집필자 · 이어쓰기 · 마무리 작가가 함께
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 leading-tight mb-6">
              혼자 못 쓰는 이야기를
              <br />
              <span className="text-violet-600">함께 완성</span>합니다
            </h1>

            <p className="text-xl text-gray-500 mb-10 leading-relaxed">
              기막힌 소재는 있는데 글을 못 쓰는 분, 소재가 고갈된 작가,
              <br className="hidden sm:block" />
              1장만 쓰고 막힌 분 — CoMuse에서 가지치기 방식으로 협업하세요.
              <br className="hidden sm:block" />
              AI가 기여도를 분석하고, IP 판매 수익을 이더리움으로 배분합니다.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/works">
                <Button size="lg" className="w-full sm:w-auto">
                  작품 탐색하기
                </Button>
              </Link>
              <Link href="/works/new">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  소재 올리기
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* 배경 그라디언트 */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-violet-50 blur-3xl opacity-70" />
          <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full bg-blue-50 blur-3xl opacity-70" />
        </div>
      </section>

      {/* 작동 방식 */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            이렇게 작동합니다
          </h2>
          <p className="text-center text-gray-500 mb-14 max-w-xl mx-auto">
            git의 브랜치처럼, 이야기도 무한히 가지치기할 수 있습니다
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((step, i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-6 border border-gray-200 hover:border-violet-200 hover:shadow-sm transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600 text-lg font-black mb-4">
                  {step.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 역할 타입 */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            당신은 어떤 창작자인가요?
          </h2>
          <p className="text-center text-gray-500 mb-14">
            CoMuse는 모든 유형의 창작자를 위한 자리가 있습니다
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CREATOR_TYPES.map((type, i) => (
              <div
                key={i}
                className="p-5 rounded-xl border border-gray-200 hover:border-violet-200 transition-colors"
              >
                <div className="text-3xl mb-3">{type.emoji}</div>
                <h3 className="font-semibold text-gray-900 mb-1">{type.title}</h3>
                <p className="text-sm text-gray-500">{type.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 비즈니스 모델 */}
      <section className="bg-gradient-to-br from-violet-600 to-indigo-700 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
          <h2 className="text-3xl font-bold text-center mb-4">수익 배분 시스템</h2>
          <p className="text-center text-violet-200 mb-14 max-w-xl mx-auto">
            IP가 팔리면 AI 분석 기여도대로 이더리움 스마트 컨트랙트를 통해 자동 배분
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {REVENUE_MODEL.map((item, i) => (
              <div
                key={i}
                className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/20"
              >
                <div className="text-2xl mb-3">{item.icon}</div>
                <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-violet-200 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white py-20">
        <div className="max-w-2xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            지금 바로 시작하세요
          </h2>
          <p className="text-gray-500 mb-8">
            소설, 시나리오, 뮤지컬, 작사, 공동연구 — 장르 제한 없음
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg">무료로 시작하기</Button>
            </Link>
            <Link href="/works">
              <Button size="lg" variant="secondary">
                작품 둘러보기
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

const HOW_IT_WORKS = [
  {
    icon: "💡",
    title: "소재 올리기",
    desc: "아이디어나 소재를 올리면 자동으로 메인 브랜치가 생성됩니다. 여기서 모든 가지가 시작됩니다.",
  },
  {
    icon: "✍️",
    title: "집필 & 이어쓰기",
    desc: "누구든 Segment를 추가하거나, 마음에 드는 지점에서 새로운 브랜치를 만들어 다른 방향으로 이어갈 수 있습니다.",
  },
  {
    icon: "🤖",
    title: "AI 기여도 분석",
    desc: "Claude AI가 각 기여의 독창성, 품질, 영향도를 분석해 기여 비율을 자동 계산합니다.",
  },
  {
    icon: "⟠",
    title: "이더리움 수익 배분",
    desc: "IP가 판매되면 스마트 컨트랙트가 기여 비율대로 ETH를 각 기여자에게 자동 배분합니다.",
  },
];

const CREATOR_TYPES = [
  {
    emoji: "💡",
    title: "아이디어 제공자",
    desc: "기막힌 소재는 있는데 글을 못 쓰시나요? 소재만 올려도 됩니다.",
  },
  {
    emoji: "✍️",
    title: "집필 작가",
    desc: "소재가 고갈됐나요? 다른 사람의 아이디어에 살을 붙여 보세요.",
  },
  {
    emoji: "🔀",
    title: "이어쓰기 작가",
    desc: "1장부터 맘에 안 들거나, 다른 방향으로 전개하고 싶다면 새 브랜치를 만드세요.",
  },
  {
    emoji: "🎯",
    title: "마무리 전문가",
    desc: "결말을 잘 쓰시나요? 주인공이 살고 죽는 여러 버전의 엔딩을 제안해보세요.",
  },
];

const REVENUE_MODEL = [
  {
    icon: "💰",
    title: "IP 판매 수익",
    desc: "플랫폼에서 탄생한 IP가 드라마, 영화, 웹툰 등으로 팔릴 때 기여자들에게 수익이 배분됩니다.",
  },
  {
    icon: "⬆️",
    title: "프리미엄 상위노출",
    desc: "더 많은 독자에게 작품을 노출하고 싶다면 프리미엄 플랜으로 상위에 노출하세요.",
  },
  {
    icon: "⟠",
    title: "Web3 글로벌 정산",
    desc: "이더리움 기반 스마트 컨트랙트로 국가·통화에 관계없이 글로벌 기여자에게 투명하게 배분됩니다.",
  },
];

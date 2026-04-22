'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

const TRANSLATIONS: Record<string, {
  badge: string;
  title: string;
  subtitle: string;
  reward: string;
  criteria: string[];
  progress: string;
  cta: string;
  close: string;
  spots: string;
  qualified: string;
}> = {
  ko: {
    badge: '🏅 Founding 100',
    title: '우리는 스타트업입니다.',
    subtitle: 'Comuse는 글로벌 IP를 함께 만드는 최초의 협업 창작 플랫폼입니다. 누구나 소재·스토리·결말 중 하나만 기여해도 됩니다. AI가 기여도를 분석하고, IP가 팔리면 이더리움으로 수익을 나눕니다.',
    reward: '💰 처음 100명의 활성 멤버에게: Comuse 첫 IP 판매 수익의 1%를 영구 분배합니다. 넷플릭스가 $1M에 구매하면 → 100명이 $100씩. $10M이면 → 1인당 $1,000.',
    criteria: [
      '30일 내 10일 이상 방문 (하루 1회)',
      '브랜치 또는 프로젝트 1개 이상 작성',
      '다른 창작자 글에 반응 3회 이상',
    ],
    progress: '내 진행 현황',
    cta: '지금 시작하기',
    close: '나중에 보기',
    spots: '남은 자리',
    qualified: '🎉 축하해요! Founding Member 자격을 얻었어요!',
  },
  en: {
    badge: '🏅 Founding 100',
    title: 'We are a startup.',
    subtitle: 'Comuse is the first collaborative IP creation platform where anyone can contribute — just a concept, a scene, or an ending. AI measures your contribution, and when IP sells, revenue is split via Ethereum.',
    reward: '💰 First 100 active members get: 1% of Comuse\'s first IP sale revenue — forever. If Netflix buys for $1M → $100 each. $10M → $1,000 each. Life-changing jackpot potential.',
    criteria: [
      'Visit 10+ days within 30 days (once per day)',
      'Write at least 1 branch or project',
      'React to 3+ other creators\' work',
    ],
    progress: 'My Progress',
    cta: 'Start Now',
    close: 'Maybe Later',
    spots: 'Spots Left',
    qualified: '🎉 Congratulations! You\'ve earned Founding Member status!',
  },
  ja: {
    badge: '🏅 Founding 100',
    title: '私たちはスタートアップです。',
    subtitle: 'Comuseは、誰でも素材・ストーリー・結末のどれか一つを提供するだけで参加できる、グローバルIP共同創作プラットフォームです。AIが貢献度を分析し、IPが売れたらイーサリアムで収益を分配します。',
    reward: '💰 最初の100名のアクティブメンバーに：ComUseの最初のIP販売収益の1%を永久分配。Netflixが$1Mで購入すれば → 各自$100。$10Mなら → 各自$1,000。',
    criteria: [
      '30日以内に10日以上訪問（1日1回）',
      'ブランチまたはプロジェクトを1つ以上作成',
      '他のクリエイターの作品に3回以上反応',
    ],
    progress: '進捗状況',
    cta: '今すぐ始める',
    close: '後で見る',
    spots: '残り枠',
    qualified: '🎉 おめでとうございます！Founding Memberの資格を獲得しました！',
  },
  zh: {
    badge: '🏅 Founding 100',
    title: '我们是一家初创公司。',
    subtitle: 'Comuse是首个全球协作IP创作平台，任何人只需贡献一个概念、一段故事或一个结局即可参与。AI分析贡献度，IP出售后通过以太坊分配收益。',
    reward: '💰 前100名活跃成员将获得：Comuse首次IP销售收益的1%永久分配。Netflix以$1M购买 → 每人$100。$10M → 每人$1,000。',
    criteria: [
      '30天内访问10天以上（每天1次）',
      '至少创建1个分支或项目',
      '对其他创作者的作品反应3次以上',
    ],
    progress: '我的进度',
    cta: '立即开始',
    close: '稍后再看',
    spots: '剩余名额',
    qualified: '🎉 恭喜！您已获得创始成员资格！',
  },
  es: {
    badge: '🏅 Founding 100',
    title: 'Somos una startup.',
    subtitle: 'Comuse es la primera plataforma de creación colaborativa de IP donde cualquiera puede contribuir con solo un concepto, una escena o un final. La IA mide tu contribución y cuando el IP se vende, los ingresos se dividen vía Ethereum.',
    reward: '💰 Los primeros 100 miembros activos reciben: 1% de los ingresos de la primera venta de IP de Comuse para siempre. Si Netflix compra por $1M → $100 cada uno. $10M → $1,000 cada uno.',
    criteria: [
      'Visita 10+ días en 30 días (una vez al día)',
      'Escribe al menos 1 rama o proyecto',
      'Reacciona al trabajo de 3+ otros creadores',
    ],
    progress: 'Mi Progreso',
    cta: 'Empezar Ahora',
    close: 'Quizás Después',
    spots: 'Lugares Restantes',
    qualified: '🎉 ¡Felicitaciones! ¡Has obtenido el estado de Miembro Fundador!',
  },
};

function getLang(): string {
  const lang = navigator.language.split('-')[0];
  return TRANSLATIONS[lang] ? lang : 'en';
}

interface Progress {
  visit_days: number;
  branch_count: number;
  reaction_count: number;
  qualified: boolean;
  badge_granted: boolean;
}

export function FoundingPopup() {
  const supabase = createClient();
  const [show, setShow] = useState(false);
  const [lang, setLang] = useState('en');
  const [spotsLeft, setSpotsLeft] = useState(100);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const dismissed = sessionStorage.getItem('founding_popup_dismissed');
    if (dismissed) return;

    const detectedLang = getLang();
    setLang(detectedLang);

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      // 남은 자리 계산
      const { count } = await supabase
        .from('founding_members')
        .select('*', { count: 'exact', head: true });
      setSpotsLeft(100 - (count ?? 0));

      if (user) {
        // 오늘 방문 기록
        await supabase.from('founding_activity').upsert({
          user_id: user.id,
          activity_type: 'visit',
          activity_date: new Date().toISOString().split('T')[0],
        }, { onConflict: 'user_id,activity_type,activity_date' });

        // 진행 현황 조회
        const { data: prog } = await supabase
          .from('founding_progress')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (prog) setProgress(prog as Progress);
      }

      // 2초 후 팝업 표시
      setTimeout(() => setShow(true), 2000);
    }

    load();
  }, []);

  const dismiss = () => {
    sessionStorage.setItem('founding_popup_dismissed', '1');
    setShow(false);
  };

  if (!show || spotsLeft <= 0) return null;

  const t = TRANSLATIONS[lang];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="bg-gradient-to-br from-primary-600 to-violet-700 rounded-t-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-lg font-bold">{t.badge}</span>
            <span className="bg-white/20 text-white text-sm font-semibold px-3 py-1 rounded-full">
              {spotsLeft} {t.spots}
            </span>
          </div>
          <h2 className="text-2xl font-black mb-2">{t.title}</h2>
          <p className="text-primary-100 text-sm leading-relaxed">{t.subtitle}</p>
        </div>

        <div className="p-6 space-y-5">
          {/* 보상 */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm leading-relaxed text-amber-900">{t.reward}</p>
          </div>

          {/* 자격 조건 */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">{t.progress}</h3>
            <div className="space-y-2">
              {[
                { label: t.criteria[0], current: progress?.visit_days ?? 0, target: 10, key: 'visit' },
                { label: t.criteria[1], current: progress?.branch_count ?? 0, target: 1, key: 'branch' },
                { label: t.criteria[2], current: progress?.reaction_count ?? 0, target: 3, key: 'reaction' },
              ].map((item) => {
                const done = item.current >= item.target;
                const pct = Math.min((item.current / item.target) * 100, 100);
                return (
                  <div key={item.key} className="flex items-center gap-3">
                    <span className={`text-lg ${done ? 'text-green-500' : 'text-gray-300'}`}>
                      {done ? '✓' : '○'}
                    </span>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600">{item.label}</span>
                        <span className="font-medium">{item.current}/{item.target}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full">
                        <div
                          className={`h-full rounded-full transition-all ${done ? 'bg-green-500' : 'bg-primary-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 자격 달성 메시지 */}
          {progress?.qualified && !progress?.badge_granted && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <p className="text-green-800 font-semibold text-sm">{t.qualified}</p>
            </div>
          )}

          {/* 버튼 */}
          <div className="flex gap-3">
            {!user ? (
              <a
                href="/login"
                className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-semibold text-center hover:bg-primary-700 transition"
              >
                {t.cta}
              </a>
            ) : (
              <a
                href="/projects/new"
                className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-semibold text-center hover:bg-primary-700 transition"
              >
                {t.cta}
              </a>
            )}
            <button
              onClick={dismiss}
              className="px-4 py-3 border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50 transition text-sm"
            >
              {t.close}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

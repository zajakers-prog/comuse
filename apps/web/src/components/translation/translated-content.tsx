'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

const LANGUAGE_FLAGS: Record<string, string> = {
  ko: '🇰🇷', en: '🇺🇸', ja: '🇯🇵', zh: '🇨🇳',
  es: '🇪🇸', fr: '🇫🇷', de: '🇩🇪', pt: '🇧🇷',
  ru: '🇷🇺', ar: '🇸🇦', hi: '🇮🇳', it: '🇮🇹',
};

const LANGUAGE_NAMES: Record<string, string> = {
  ko: '한국어', en: 'English', ja: '日本語', zh: '中文',
  es: 'Español', fr: 'Français', de: 'Deutsch', pt: 'Português',
  ru: 'Русский', ar: 'العربية', hi: 'हिन्दी', it: 'Italiano',
};

interface TranslatedContentProps {
  sourceType: 'branch' | 'project';
  sourceId: string;
  originalTitle: string;
  originalContent: string;
  // 원문 언어 (모르면 undefined → AI가 감지)
  sourceLanguage?: string;
}

type TranslationState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'translated'; title: string; text: string; sourceLang: string }
  | { status: 'error' }
  | { status: 'same_language' };

export function TranslatedContent({
  sourceType,
  sourceId,
  originalTitle,
  originalContent,
  sourceLanguage,
}: TranslatedContentProps) {
  const supabase = createClient();
  const [translation, setTranslation] = useState<TranslationState>({ status: 'idle' });
  const [showOriginal, setShowOriginal] = useState(false);
  const [userLang, setUserLang] = useState<string>('en');

  useEffect(() => {
    // 브라우저 언어 감지 (e.g. "ko-KR" → "ko")
    const lang = navigator.language.split('-')[0];
    setUserLang(lang);

    // 원문 언어와 같으면 번역 불필요
    if (sourceLanguage && lang === sourceLanguage) {
      setTranslation({ status: 'same_language' });
      return;
    }

    // 영어면 기본 언어 — 번역 스킵 (원문이 영어가 아닐 때만 번역)
    // 실제로는 원문 언어를 모르므로 일단 시도
    if (lang === 'en' && !sourceLanguage) {
      setTranslation({ status: 'same_language' });
      return;
    }

    autoTranslate(lang);
  }, [sourceId]);

  async function autoTranslate(targetLang: string) {
    setTranslation({ status: 'loading' });

    try {
      // 1. DB 캐시 먼저 확인
      const { data: cached } = await supabase
        .from('translations')
        .select('translated_content')
        .eq('source_type', sourceType)
        .eq('source_id', sourceId)
        .eq('language', targetLang)
        .maybeSingle();

      if (cached?.translated_content) {
        const c = cached.translated_content as any;
        setTranslation({
          status: 'translated',
          title: c.title,
          text: c.text,
          sourceLang: c.source_language ?? sourceLanguage ?? 'unknown',
        });
        return;
      }

      // 2. 캐시 없으면 Edge Function 호출
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai-translate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({ sourceType, sourceId, targetLanguage: targetLang }),
        }
      );

      const result = await res.json();

      if (result.skipped || result.error) {
        setTranslation({ status: 'same_language' });
        return;
      }

      const c = result.translated_content as any;
      setTranslation({
        status: 'translated',
        title: c.title,
        text: c.text,
        sourceLang: c.source_language ?? sourceLanguage ?? 'unknown',
      });
    } catch {
      setTranslation({ status: 'error' });
    }
  }

  // 번역 불필요 or 에러 → 원문 그대로
  if (
    translation.status === 'same_language' ||
    translation.status === 'error' ||
    translation.status === 'idle'
  ) {
    return (
      <div className="prose max-w-none">
        {originalContent ? (
          <div dangerouslySetInnerHTML={{ __html: originalContent }} />
        ) : (
          <p className="text-gray-400">No content yet.</p>
        )}
      </div>
    );
  }

  const displayTitle = showOriginal ? originalTitle : translation.status === 'translated' ? translation.title : originalTitle;
  const displayContent = showOriginal ? originalContent : translation.status === 'translated' ? translation.text : originalContent;
  const sourceLang = translation.status === 'translated' ? translation.sourceLang : '';

  return (
    <div>
      {/* 번역 배지 */}
      {translation.status === 'translated' && (
        <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
          <span>
            {LANGUAGE_FLAGS[sourceLang] ?? '🌐'} Translated from{' '}
            <span className="font-medium">{LANGUAGE_NAMES[sourceLang] ?? sourceLang}</span>
          </span>
          <span className="text-gray-300">·</span>
          <button
            onClick={() => setShowOriginal((v) => !v)}
            className="underline hover:text-gray-700 transition"
          >
            {showOriginal ? `Show ${LANGUAGE_NAMES[userLang] ?? userLang}` : 'Show original'}
          </button>
        </div>
      )}

      {translation.status === 'loading' && (
        <div className="flex items-center gap-1.5 mb-3 text-xs text-gray-400">
          <span className="inline-block w-3 h-3 border-2 border-gray-300 border-t-primary-500 rounded-full animate-spin" />
          Translating…
        </div>
      )}

      {/* 제목 (번역됐을 때만 표시) */}
      {translation.status === 'translated' && !showOriginal && translation.title !== originalTitle && (
        <p className="text-sm text-gray-400 mb-1 italic">
          Original: "{originalTitle}"
        </p>
      )}

      {/* 본문 */}
      <div className="prose max-w-none">
        {displayContent ? (
          <div dangerouslySetInnerHTML={{ __html: displayContent }} />
        ) : (
          <p className="text-gray-400">No content yet.</p>
        )}
      </div>
    </div>
  );
}

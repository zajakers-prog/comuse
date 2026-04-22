import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LANGUAGE_NAMES: Record<string, string> = {
  ko: 'Korean', en: 'English', ja: 'Japanese',
  zh: 'Chinese (Simplified)', es: 'Spanish', fr: 'French',
  de: 'German', pt: 'Portuguese', ru: 'Russian', ar: 'Arabic',
  hi: 'Hindi', it: 'Italian',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { sourceType, sourceId, targetLanguage } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 이미 번역본 있으면 그대로 반환
    const { data: existing } = await supabase
      .from('translations')
      .select('*')
      .eq('source_type', sourceType)
      .eq('source_id', sourceId)
      .eq('language', targetLanguage)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify(existing), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 원문 가져오기
    let title = '';
    let content = '';
    let sourceLanguage = 'en';

    if (sourceType === 'branch') {
      const { data } = await supabase
        .from('branches')
        .select('title, content')
        .eq('id', sourceId)
        .single();
      if (!data) throw new Error('Branch not found');
      title = data.title;
      content = (data.content as any)?.text ?? '';
    } else {
      const { data } = await supabase
        .from('projects')
        .select('title, description, language')
        .eq('id', sourceId)
        .single();
      if (!data) throw new Error('Project not found');
      title = data.title;
      content = data.description ?? '';
      sourceLanguage = data.language ?? 'en';
    }

    // 원문과 같은 언어면 번역 불필요
    if (targetLanguage === sourceLanguage) {
      return new Response(JSON.stringify({ skipped: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const langName = LANGUAGE_NAMES[targetLanguage] ?? targetLanguage;
    const sourceLangName = LANGUAGE_NAMES[sourceLanguage] ?? sourceLanguage;

    // Claude API로 번역
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: `You are a professional literary translator. Translate the following creative writing from ${sourceLangName} to ${langName}.

Rules:
- Preserve the original tone, style, and emotional nuance
- Keep HTML tags intact if present
- Respond ONLY with valid JSON, no extra text: {"title": "...", "text": "...", "source_language": "${sourceLanguage}"}

Title: ${title}

Content:
${content.substring(0, 8000)}`,
          },
        ],
      }),
    });

    const aiResult = await response.json();
    const rawText = aiResult.content[0].text.trim();
    const translated = JSON.parse(rawText);

    // DB에 캐싱
    const { data: translation } = await supabase
      .from('translations')
      .insert({
        source_type: sourceType,
        source_id: sourceId,
        language: targetLanguage,
        translated_content: { ...translated, source_language: sourceLanguage },
        translator_type: 'ai',
      })
      .select()
      .single();

    return new Response(JSON.stringify(translation), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

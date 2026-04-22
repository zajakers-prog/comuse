import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { branchId } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch branch content
    const { data: branch, error } = await supabase
      .from('branches')
      .select('*, projects(title, category)')
      .eq('id', branchId)
      .single();

    if (error || !branch) {
      return new Response(JSON.stringify({ error: 'Branch not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const content = (branch.content as any)?.text ?? '';
    if (!content) {
      return new Response(JSON.stringify({ error: 'No content to evaluate' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const openaiKey = Deno.env.get('OPENAI_API_KEY');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a creative content evaluator. Analyze the given content and respond in JSON format with:
- commercial_score: 0-100 (market potential, audience appeal, monetization viability)
- artistic_score: 0-100 (originality, craft quality, emotional impact)
- summary_10lines: a 10-line summary of the content (each line separated by newline)

Respond ONLY with valid JSON, no markdown.`,
          },
          {
            role: 'user',
            content: `Category: ${(branch as any).projects?.category ?? 'writing'}
Title: ${branch.title}
Content:
${content.substring(0, 8000)}`,
          },
        ],
        temperature: 0.3,
      }),
    });

    const aiResult = await response.json();
    const parsed = JSON.parse(aiResult.choices[0].message.content);

    // Save evaluation
    const { data: evaluation } = await supabase
      .from('ai_evaluations')
      .insert({
        branch_id: branchId,
        commercial_score: parsed.commercial_score,
        artistic_score: parsed.artistic_score,
        summary_10lines: parsed.summary_10lines,
      })
      .select()
      .single();

    return new Response(JSON.stringify(evaluation), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

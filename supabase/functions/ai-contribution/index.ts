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

    // Get the branch and its ancestor chain
    const { data: branch } = await supabase
      .from('branches')
      .select('*, projects(title, creator_id)')
      .eq('id', branchId)
      .single();

    if (!branch) {
      return new Response(JSON.stringify({ error: 'Branch not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Walk up the tree to collect all ancestors
    const ancestors: any[] = [];
    let currentId = branch.parent_branch_id;
    while (currentId) {
      const { data: parent } = await supabase
        .from('branches')
        .select('id, title, author_id, content, parent_branch_id')
        .eq('id', currentId)
        .single();
      if (!parent) break;
      ancestors.unshift(parent);
      currentId = parent.parent_branch_id;
    }

    // Build contributor list with context
    const contributors: { userId: string; role: string; contentLength: number }[] = [];

    // Original project creator = material provider
    const projectCreatorId = (branch as any).projects?.creator_id;
    if (projectCreatorId) {
      contributors.push({ userId: projectCreatorId, role: 'material', contentLength: 0 });
    }

    // Each ancestor author contributed
    for (const a of ancestors) {
      const len = ((a.content as any)?.text ?? '').length;
      contributors.push({ userId: a.author_id, role: 'story', contentLength: len });
    }

    // Current branch author
    const currentLen = ((branch.content as any)?.text ?? '').length;
    contributors.push({ userId: branch.author_id, role: 'expansion', contentLength: currentLen });

    // Calculate scores based on content length ratio
    const totalLen = contributors.reduce((s, c) => s + c.contentLength, 0) || 1;

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    const branchContent = ((branch.content as any)?.text ?? '').substring(0, 4000);
    const ancestorSummary = ancestors
      .map((a) => `- ${a.title}: ${((a.content as any)?.text ?? '').substring(0, 500)}`)
      .join('\n');

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
            content: `You are a contribution analyzer for collaborative creative works.
Given the branch chain (ancestors -> current), estimate each contributor's percentage of creative contribution.
Consider: originality of ideas, amount of content, narrative importance, and creative direction.
Respond ONLY with valid JSON array: [{"user_id": "...", "role": "...", "ai_score": 0-100}]
Scores must sum to 100.`,
          },
          {
            role: 'user',
            content: `Contributors (in order):
${contributors.map((c) => `UserID: ${c.userId}, Role: ${c.role}, ContentLen: ${c.contentLength}`).join('\n')}

Ancestor chain:
${ancestorSummary || '(root branch, no ancestors)'}

Current branch content:
${branchContent}`,
          },
        ],
        temperature: 0.2,
      }),
    });

    const aiResult = await response.json();
    const scores = JSON.parse(aiResult.choices[0].message.content);

    // Upsert contributions
    for (const score of scores) {
      await supabase
        .from('contributions')
        .upsert(
          {
            branch_id: branchId,
            user_id: score.user_id,
            role: score.role,
            ai_score: score.ai_score,
            confirmed_at: new Date().toISOString(),
          },
          { onConflict: 'branch_id,user_id' }
        );
    }

    return new Response(JSON.stringify({ contributions: scores }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

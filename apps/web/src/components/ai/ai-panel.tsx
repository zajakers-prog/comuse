'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface AiPanelProps {
  branchId: string;
  sourceType?: 'branch' | 'project';
}

interface Evaluation {
  commercial_score: number;
  artistic_score: number;
  summary_10lines: string;
}

export function AiPanel({ branchId, sourceType = 'branch' }: AiPanelProps) {
  const supabase = createClient();
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [contributions, setContributions] = useState<any[]>([]);
  const [translating, setTranslating] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const callEdgeFunction = async (name: string, body: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/${name}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(body),
      }
    );
    return res.json();
  };

  const handleEvaluate = async () => {
    setLoading('evaluate');
    const result = await callEdgeFunction('ai-evaluate', { branchId });
    if (result.commercial_score !== undefined) setEvaluation(result);
    setLoading(null);
  };

  const handleContributions = async () => {
    setLoading('contribution');
    const result = await callEdgeFunction('ai-contribution', { branchId });
    if (result.contributions) setContributions(result.contributions);
    setLoading(null);
  };

  const handleTranslate = async (lang: string) => {
    setTranslating(true);
    await callEdgeFunction('ai-translate', {
      sourceType,
      sourceId: branchId,
      targetLanguage: lang,
    });
    setTranslating(false);
    alert(`Translation to ${lang} complete!`);
  };

  const ScoreBar = ({ label, score }: { label: string; score: number }) => (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-24">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full">
        <div
          className="h-full bg-primary-500 rounded-full transition-all"
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-sm font-medium w-10 text-right">{score}</span>
    </div>
  );

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-4">
      <h3 className="font-semibold text-sm text-gray-700">AI Tools</h3>

      {/* Evaluate */}
      <div>
        <button
          onClick={handleEvaluate}
          disabled={loading === 'evaluate'}
          className="px-3 py-1.5 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:opacity-50"
        >
          {loading === 'evaluate' ? 'Evaluating...' : 'AI Evaluate'}
        </button>
        {evaluation && (
          <div className="mt-3 space-y-2">
            <ScoreBar label="Commercial" score={evaluation.commercial_score} />
            <ScoreBar label="Artistic" score={evaluation.artistic_score} />
            <div className="mt-2">
              <p className="text-xs font-medium text-gray-500 mb-1">Summary</p>
              <p className="text-sm text-gray-700 whitespace-pre-line">
                {evaluation.summary_10lines}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Contributions */}
      <div>
        <button
          onClick={handleContributions}
          disabled={loading === 'contribution'}
          className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
        >
          {loading === 'contribution' ? 'Analyzing...' : 'Analyze Contributions'}
        </button>
        {contributions.length > 0 && (
          <div className="mt-3 space-y-1">
            {contributions.map((c: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{c.role}</span>
                <span className="font-medium">{c.ai_score}%</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Translate */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-2">Translate to</p>
        <div className="flex flex-wrap gap-2">
          {['en', 'ko', 'ja', 'zh', 'es', 'fr'].map((lang) => (
            <button
              key={lang}
              onClick={() => handleTranslate(lang)}
              disabled={translating}
              className="px-2 py-1 border border-gray-200 rounded text-xs hover:bg-gray-50 disabled:opacity-50"
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

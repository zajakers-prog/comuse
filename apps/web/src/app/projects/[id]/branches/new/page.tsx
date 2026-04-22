'use client';

import { useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { MusicEditor, emptyMusicData, type MusicData } from '@/components/music/music-editor';

type BranchType = 'text' | 'music';

export default function NewBranchPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [branchType, setBranchType] = useState<BranchType>('text');
  const [musicData, setMusicData] = useState<MusicData>(emptyMusicData());

  const projectId = params.id as string;
  const parentBranchId = searchParams.get('parent');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const form = e.currentTarget;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const formData = new FormData(form);
    const title = formData.get('title') as string;

    const content = branchType === 'music'
      ? musicData
      : { text: '' };

    const { error } = await supabase.from('branches').insert({
      project_id: projectId,
      parent_branch_id: parentBranchId || null,
      author_id: user.id,
      title,
      content,
      completion_percent: 0,
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }
    router.push(`/projects/${projectId}`);
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">New Branch</h1>
      {parentBranchId && (
        <p className="text-sm text-gray-500 mb-4">
          Branching from: {parentBranchId}
        </p>
      )}

      {/* Branch type selector */}
      <div className="flex gap-3 mb-6">
        <button
          type="button"
          onClick={() => setBranchType('text')}
          className={`flex-1 py-3 rounded-xl border-2 font-medium transition ${
            branchType === 'text'
              ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
              : 'border-gray-200 text-gray-500 hover:border-gray-300'
          }`}
        >
          ✍️ 텍스트 브랜치
        </button>
        <button
          type="button"
          onClick={() => setBranchType('music')}
          className={`flex-1 py-3 rounded-xl border-2 font-medium transition ${
            branchType === 'music'
              ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
              : 'border-gray-200 text-gray-500 hover:border-gray-300'
          }`}
        >
          🎵 멜로디 브랜치
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">Branch Title</label>
          <input
            name="title"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder={branchType === 'music' ? '곡 제목 또는 분위기 설명' : 'Give your branch a title'}
          />
        </div>

        {branchType === 'music' && (
          <div>
            <label className="block text-sm font-medium mb-2">멜로디 작성</label>
            <MusicEditor onChange={setMusicData} />
            <p className="text-xs text-gray-400 mt-2">
              셀을 클릭해 음표를 추가하고 ▶ 버튼으로 미리 들어보세요.
            </p>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {errorMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 font-medium"
        >
          {loading ? 'Creating...' : 'Create Branch'}
        </button>
      </form>
    </div>
  );
}

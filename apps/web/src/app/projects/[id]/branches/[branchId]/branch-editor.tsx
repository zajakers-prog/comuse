'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TiptapEditor } from '@/components/editor/tiptap-editor';
import { AiPanel } from '@/components/ai/ai-panel';
import { ReportButton } from '@/components/report/report-button';
import { TranslatedContent } from '@/components/translation/translated-content';
import { MusicEditor, type MusicData } from '@/components/music/music-editor';
import { createClient } from '@/lib/supabase/client';

interface BranchEditorProps {
  branchId: string;
  projectId: string;
  title: string;
  initialContent: string;
  completionPercent: number;
  authorName: string;
  authorId: string;
}

export function BranchEditor({
  branchId,
  projectId,
  title,
  initialContent,
  completionPercent,
  authorName,
  authorId,
}: BranchEditorProps) {
  const router = useRouter();
  const supabase = createClient();
  const isMusicBranch = (() => {
    try { return JSON.parse(initialContent || '{}')?.type === 'music'; } catch { return false; }
  })();
  const [content, setContent] = useState(initialContent);
  const [musicData, setMusicData] = useState<MusicData | null>(() => {
    if (!isMusicBranch) return null;
    try { return JSON.parse(initialContent); } catch { return null; }
  });
  const [percent, setPercent] = useState(completionPercent);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [isAuthor, setIsAuthor] = useState(false);

  // 클라이언트에서 직접 확인 (서버/클라이언트 불일치 방지)
  useState(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAuthor(user?.id === authorId);
    });
  });

  const handleSave = useCallback(async () => {
    setSaving(true);
    const contentToSave = isMusicBranch && musicData ? musicData : { text: content };
    const { error } = await supabase
      .from('branches')
      .update({
        content: contentToSave,
        completion_percent: percent,
      })
      .eq('id', branchId);
    setSaving(false);
    if (!error) {
      setEditing(false);
      router.refresh();
    }
  }, [content, percent, branchId, supabase, router]);

  const handleDelete = useCallback(async () => {
    if (!confirm('이 브랜치를 삭제할까요? 되돌릴 수 없습니다.')) return;
    setDeleting(true);
    const { error } = await supabase
      .from('branches')
      .delete()
      .eq('id', branchId);
    if (!error) {
      router.push(`/projects/${projectId}`);
    } else {
      alert('삭제 실패: ' + error.message);
      setDeleting(false);
    }
  }, [branchId, projectId, supabase, router]);

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">{title}</h1>
          <p className="text-sm text-gray-500">
            by {authorName} · {percent}% complete
          </p>
        </div>
        <div className="flex gap-2">
          {isAuthor && !editing && (
            <>
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition text-sm disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </>
          )}
          <a
            href={`/projects/${projectId}/branches/new?parent=${branchId}`}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
          >
            Branch from here
          </a>
        </div>
      </div>

      {editing ? (
        <div className="space-y-4">
          <TiptapEditor
            content={content}
            onChange={setContent}
            placeholder="Write your story..."
          />
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Completion:</label>
            <input
              type="range"
              min={0}
              max={100}
              value={percent}
              onChange={(e) => setPercent(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm text-gray-600 w-12">{percent}%</span>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setEditing(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      ) : isMusicBranch && musicData ? (
        <MusicEditor initialData={musicData} readOnly={!editing} onChange={setMusicData} />
      ) : (
        <TranslatedContent
          sourceType="branch"
          sourceId={branchId}
          originalTitle={title}
          originalContent={content}
        />
      )}

      {/* AI Panel + Report */}
      <div className="mt-8 space-y-4">
        <AiPanel branchId={branchId} />
        <div className="flex justify-end">
          <ReportButton targetType="branch" targetId={branchId} />
        </div>
      </div>
    </div>
  );
}

import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { BranchEditor } from './branch-editor';

export default async function BranchPage({
  params,
}: {
  params: { id: string; branchId: string };
}) {
  const supabase = await createClient();

  const { data: branch } = await supabase
    .from('branches')
    .select('*, users!branches_author_id_fkey(display_name, avatar_url)')
    .eq('id', params.branchId)
    .single();

  if (!branch) return notFound();

  const raw = branch.content as Record<string, unknown> | null;
  const isMusicBranch = raw?.type === 'music';
  const initialContent = isMusicBranch
    ? JSON.stringify(raw)
    : ((raw as { text?: string })?.text ?? '');

  return (
    <div className="max-w-3xl mx-auto p-8">
      <BranchEditor
        branchId={params.branchId}
        projectId={params.id}
        title={branch.title}
        initialContent={initialContent}
        completionPercent={branch.completion_percent}
        authorName={branch.users?.display_name ?? 'Unknown'}
        authorId={branch.author_id}
      />
    </div>
  );
}

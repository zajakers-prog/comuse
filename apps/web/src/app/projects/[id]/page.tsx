import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BranchTree } from '@/components/tree/branch-tree';
import { LikeButton } from '@/components/project/like-button';
import { TranslatedContent } from '@/components/translation/translated-content';

export default async function ProjectPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  const { data: project } = await supabase
    .from('projects')
    .select('*, users!projects_creator_id_fkey(display_name, avatar_url)')
    .eq('id', params.id)
    .single();

  if (!project) return notFound();

  const { data: branches } = await supabase
    .from('branches')
    .select('*, users!branches_author_id_fkey(display_name)')
    .eq('project_id', params.id)
    .order('created_at', { ascending: true });

  const treeBranches = (branches ?? []).map((b: any) => ({
    id: b.id,
    title: b.title,
    author_name: b.users?.display_name ?? 'Unknown',
    completion_percent: b.completion_percent,
    parent_branch_id: b.parent_branch_id,
  }));

  const rootBranches = branches?.filter((b: any) => !b.parent_branch_id) ?? [];

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
            {project.category}
          </span>
          <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
            {project.license_type}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold mb-2">{project.title}</h1>
          <LikeButton projectId={params.id} />
        </div>
        <TranslatedContent
          sourceType="project"
          sourceId={params.id}
          originalTitle={project.title}
          originalContent={project.description ?? ''}
          sourceLanguage={project.language}
        />
      </div>

      {/* Tree Visualization */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Branch Tree</h2>
        <BranchTree projectId={params.id} branches={treeBranches} />
      </div>

      {/* Branch List */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">All Branches</h2>
        <Link
          href={`/projects/${params.id}/branches/new`}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm"
        >
          + New Branch
        </Link>
      </div>

      <div className="space-y-3">
        {rootBranches.map((branch: any) => (
          <BranchItem
            key={branch.id}
            branch={branch}
            allBranches={branches ?? []}
            projectId={params.id}
            depth={0}
          />
        ))}

        {rootBranches.length === 0 && (
          <p className="text-gray-500 text-center py-8">
            No branches yet. Start by creating the first one.
          </p>
        )}
      </div>

    </div>
  );
}

function BranchItem({
  branch,
  allBranches,
  projectId,
  depth,
}: {
  branch: any;
  allBranches: any[];
  projectId: string;
  depth: number;
}) {
  const children = allBranches.filter((b: any) => b.parent_branch_id === branch.id);

  return (
    <div style={{ marginLeft: depth * 24 }}>
      <Link
        href={`/projects/${projectId}/branches/${branch.id}`}
        className="block p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition"
      >
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium">{branch.title}</h3>
            <p className="text-sm text-gray-500">
              by {branch.users?.display_name ?? 'Unknown'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-500">
              {branch.completion_percent}%
            </div>
            <div className="w-16 h-1.5 bg-gray-200 rounded-full">
              <div
                className="h-full bg-primary-500 rounded-full"
                style={{ width: `${branch.completion_percent}%` }}
              />
            </div>
          </div>
        </div>
      </Link>
      {children.map((child: any) => (
        <BranchItem
          key={child.id}
          branch={child}
          allBranches={allBranches}
          projectId={projectId}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}

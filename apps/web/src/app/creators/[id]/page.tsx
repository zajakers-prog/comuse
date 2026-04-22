import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function CreatorPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  const { data: creator } = await supabase
    .from('users')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!creator) return notFound();

  // Projects created
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('creator_id', params.id)
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  // Branches contributed
  const { data: branches } = await supabase
    .from('branches')
    .select('*, projects(title)')
    .eq('author_id', params.id)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(20);

  // Contribution stats
  const { data: contributions } = await supabase
    .from('contributions')
    .select('role, ai_score')
    .eq('user_id', params.id);

  const avgScore = contributions?.length
    ? Math.round(
        contributions.reduce((s, c) => s + (c.ai_score ?? 0), 0) / contributions.length
      )
    : 0;

  const roleCount: Record<string, number> = {};
  contributions?.forEach((c) => {
    roleCount[c.role] = (roleCount[c.role] ?? 0) + 1;
  });

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Profile Header */}
      <div className="flex items-center gap-4 mb-8">
        {creator.avatar_url ? (
          <img
            src={creator.avatar_url}
            alt=""
            className="w-16 h-16 rounded-full"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-xl font-bold">
            {(creator.display_name ?? creator.email)?.[0]?.toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold">
            {creator.display_name ?? 'Anonymous'}
          </h1>
          <p className="text-sm text-gray-500">
            Joined {new Date(creator.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold">{projects?.length ?? 0}</div>
          <div className="text-sm text-gray-500">Projects</div>
        </div>
        <div className="border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold">{branches?.length ?? 0}</div>
          <div className="text-sm text-gray-500">Branches</div>
        </div>
        <div className="border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold">{avgScore}%</div>
          <div className="text-sm text-gray-500">Avg Contribution</div>
        </div>
      </div>

      {/* Role Tags */}
      {Object.keys(roleCount).length > 0 && (
        <div className="flex gap-2 mb-8">
          {Object.entries(roleCount).map(([role, count]) => (
            <span
              key={role}
              className="px-3 py-1 bg-gray-100 rounded-full text-sm"
            >
              {role} ({count})
            </span>
          ))}
        </div>
      )}

      {/* Projects */}
      <h2 className="text-xl font-semibold mb-4">Projects</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {projects?.map((p: any) => (
          <Link
            key={p.id}
            href={`/projects/${p.id}`}
            className="block p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition"
          >
            <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">
              {p.category}
            </span>
            <h3 className="font-semibold mt-2">{p.title}</h3>
            <p className="text-sm text-gray-500 line-clamp-1">{p.description}</p>
          </Link>
        ))}
        {(!projects || projects.length === 0) && (
          <p className="text-gray-400">No projects yet.</p>
        )}
      </div>

      {/* Branches */}
      <h2 className="text-xl font-semibold mb-4">Contributions</h2>
      <div className="space-y-2">
        {branches?.map((b: any) => (
          <Link
            key={b.id}
            href={`/projects/${b.project_id}/branches/${b.id}`}
            className="block p-3 border border-gray-200 rounded-lg hover:border-primary-300 transition"
          >
            <div className="flex justify-between items-center">
              <div>
                <span className="font-medium">{b.title}</span>
                <span className="text-xs text-gray-400 ml-2">
                  in {(b as any).projects?.title}
                </span>
              </div>
              <span className="text-xs text-gray-500">{b.completion_percent}%</span>
            </div>
          </Link>
        ))}
        {(!branches || branches.length === 0) && (
          <p className="text-gray-400">No contributions yet.</p>
        )}
      </div>
    </div>
  );
}

import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('creator_id', user?.id)
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Link
          href="/projects/new"
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
        >
          + New Project
        </Link>
      </div>

      {user && (
        <p className="text-gray-600 mb-6">Welcome, {user.email}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects?.map((project) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="block p-6 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-md transition"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                {project.category}
              </span>
              <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                {project.language}
              </span>
            </div>
            <h3 className="text-lg font-semibold mb-1">{project.title}</h3>
            <p className="text-sm text-gray-600 line-clamp-2">
              {project.description}
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
              <span>{project.license_type}</span>
              <span>·</span>
              <span>{project.status}</span>
            </div>
          </Link>
        ))}

        {(!projects || projects.length === 0) && (
          <p className="text-gray-500 col-span-full text-center py-12">
            No projects yet. Create your first one!
          </p>
        )}
      </div>
    </div>
  );
}

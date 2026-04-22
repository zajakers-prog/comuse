'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase
      .from('projects')
      .select('*')
      .eq('id', params.id)
      .single()
      .then(({ data }) => setProject(data));
  }, [params.id]);

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);

    await supabase
      .from('projects')
      .update({
        title: fd.get('title') as string,
        description: fd.get('description') as string,
        language: fd.get('language') as string,
        license_type: fd.get('license_type') as string,
        status: fd.get('status') as string,
      })
      .eq('id', params.id);

    setLoading(false);
    router.push(`/projects/${params.id}`);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure? This will delete the project and all branches.')) return;
    await supabase.from('projects').delete().eq('id', params.id);
    router.push('/dashboard');
  };

  if (!project) return <div className="p-8">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Edit Project</h1>
      <form onSubmit={handleUpdate} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            name="title"
            defaultValue={project.title}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            name="description"
            defaultValue={project.description}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Language</label>
            <select name="language" defaultValue={project.language} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="ko">Korean</option>
              <option value="en">English</option>
              <option value="ja">Japanese</option>
              <option value="zh">Chinese</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">License</label>
            <select name="license_type" defaultValue={project.license_type} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="open">Open</option>
              <option value="approval">Approval</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select name="status" defaultValue={project.status} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
      <button
        onClick={handleDelete}
        className="w-full mt-4 py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition"
      >
        Delete Project
      </button>
    </div>
  );
}

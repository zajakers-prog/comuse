'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'writing', label: 'Writing' },
  { value: 'music', label: 'Music' },
  { value: 'comic', label: 'Comic' },
  { value: 'screenplay', label: 'Screenplay' },
  { value: 'lyrics', label: 'Lyrics' },
];

export default function ExplorePage() {
  const supabase = createClient();
  const [projects, setProjects] = useState<any[]>([]);
  const [promoted, setPromoted] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [language, setLanguage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      let query = supabase
        .from('projects')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(50);

      if (category) query = query.eq('category', category);
      if (language) query = query.eq('language', language);
      if (search) query = query.ilike('title', `%${search}%`);

      const { data } = await query;

      // Fetch active promotions
      const { data: promos } = await supabase
        .from('promotions')
        .select('branch_id, branches(project_id)')
        .gte('end_at', new Date().toISOString());

      const promoProjectIds = new Set(
        (promos ?? []).map((p: any) => p.branches?.project_id).filter(Boolean)
      );
      setPromoted(promoProjectIds as Set<string>);

      // Sort: promoted first
      const sorted = (data ?? []).sort((a: any, b: any) => {
        const aP = promoProjectIds.has(a.id) ? 0 : 1;
        const bP = promoProjectIds.has(b.id) ? 0 : 1;
        return aP - bP;
      });

      setProjects(sorted);
      setLoading(false);
    }
    load();
  }, [search, category, language]);

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Explore</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg flex-1 min-w-[200px]"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="">All Languages</option>
          <option value="ko">Korean</option>
          <option value="en">English</option>
          <option value="ja">Japanese</option>
          <option value="zh">Chinese</option>
        </select>
      </div>

      {/* Results */}
      {loading ? (
        <p className="text-gray-400 text-center py-12">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="block p-6 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-md transition"
            >
              <div className="flex items-center gap-2 mb-2">
                {promoted.has(p.id) && (
                  <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full font-medium">Promoted</span>
                )}
                <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">{p.category}</span>
                <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">{p.language}</span>
              </div>
              <h3 className="text-lg font-semibold mb-1">{p.title}</h3>
              <p className="text-sm text-gray-600 line-clamp-2">{p.description}</p>
            </Link>
          ))}
          {projects.length === 0 && (
            <p className="text-gray-500 col-span-full text-center py-12">
              No projects found.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

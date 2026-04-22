'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export function LikeButton({ projectId }: { projectId: string }) {
  const supabase = createClient();
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);

      const { count: c } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId);
      setCount(c ?? 0);

      if (user) {
        const { data } = await supabase
          .from('likes')
          .select('id')
          .eq('project_id', projectId)
          .eq('user_id', user.id)
          .maybeSingle();
        setLiked(!!data);
      }
    }
    load();
  }, [projectId]);

  async function toggle() {
    if (!userId || loading) return;
    setLoading(true);

    if (liked) {
      await supabase.from('likes').delete().eq('project_id', projectId).eq('user_id', userId);
      setLiked(false);
      setCount((c) => c - 1);
    } else {
      await supabase.from('likes').insert({ project_id: projectId, user_id: userId });
      setLiked(true);
      setCount((c) => c + 1);
    }
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={!userId || loading}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
        liked
          ? 'bg-red-50 border-red-200 text-red-600'
          : 'bg-white border-gray-200 text-gray-600 hover:border-red-200 hover:text-red-500'
      } disabled:opacity-40`}
    >
      <span>{liked ? '♥' : '♡'}</span>
      <span>{count}</span>
    </button>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function ProfilePage() {
  const supabase = createClient();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      setProfile(data);
      setLoading(false);
    }
    loadProfile();
  }, []);

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    await supabase
      .from('users')
      .update({
        display_name: formData.get('display_name') as string,
        locale: formData.get('locale') as string,
      })
      .eq('id', profile.id);

    router.refresh();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="max-w-lg mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Profile</h1>
      <form onSubmit={handleUpdate} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Display Name</label>
          <input
            name="display_name"
            defaultValue={profile?.display_name ?? ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            value={profile?.email ?? ''}
            disabled
            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Locale</label>
          <select
            name="locale"
            defaultValue={profile?.locale ?? 'en'}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="ko">Korean</option>
            <option value="en">English</option>
            <option value="ja">Japanese</option>
          </select>
        </div>
        <button
          type="submit"
          className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
        >
          Save
        </button>
      </form>
      <button
        onClick={handleLogout}
        className="w-full mt-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition"
      >
        Sign Out
      </button>
    </div>
  );
}

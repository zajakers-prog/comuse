'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { NotificationBell } from '@/components/notifications/notification-bell';

export function Navbar() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoaded(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <nav className="border-b border-gray-200 bg-white sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold text-primary-600">
            Comuse
          </Link>
          <Link href="/explore" className="text-sm text-gray-600 hover:text-gray-900">
            Explore
          </Link>
          {user && (
            <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
              Dashboard
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          {loaded && (
            user ? (
              <>
                <NotificationBell />
                <Link href="/projects/new" className="text-sm px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">
                  + New Project
                </Link>
                <Link href="/profile" className="text-sm text-gray-600 hover:text-gray-900">
                  Profile
                </Link>
                <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-gray-600 transition">
                  Sign out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="text-sm px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
              >
                Sign in
              </Link>
            )
          )}
        </div>
      </div>
    </nav>
  );
}

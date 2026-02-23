"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { GenreBadge, StatusBadge } from "@/components/ui/badge";

interface ProfileData {
  id: string; username: string; displayName: string; bio?: string | null;
  avatarUrl?: string | null; ethAddress?: string | null; createdAt: string;
  _count: { followers: number; following: number; segmentsWritten: number };
  worksAuthored: Array<{
    id: string; title: string; logline: string; genre: string; status: string;
    views: number; tags: string[];
    _count: { likes: number; branches: number };
  }>;
  contributions: Array<{
    workId: string; percentage: number; segmentCount: number; totalWords: number;
    work: { id: string; title: string; genre: string; status: string };
  }>;
}

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [tab, setTab] = useState<"works" | "contributions">("works");

  useEffect(() => {
    fetch(`/api/users/${username}`).then(r => r.json()).then(d => { if (d.success) setProfile(d.data); });
  }, [username]);

  if (!profile) return <div className="max-w-3xl mx-auto px-4 py-20 text-center text-gray-400">로딩 중...</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* 프로필 헤더 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-violet-200 flex items-center justify-center text-2xl font-black text-violet-700">
            {profile.displayName[0]}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{profile.displayName}</h1>
            <p className="text-gray-400 text-sm">@{profile.username}</p>
            {profile.bio && <p className="text-gray-600 text-sm mt-2">{profile.bio}</p>}
            {profile.ethAddress && (
              <p className="text-xs text-gray-400 font-mono mt-1">
                ⟠ {profile.ethAddress.slice(0, 8)}…{profile.ethAddress.slice(-6)}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-6 mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500">
          <span><b className="text-gray-900">{profile._count.followers}</b> 팔로워</span>
          <span><b className="text-gray-900">{profile._count.following}</b> 팔로잉</span>
          <span><b className="text-gray-900">{profile._count.segmentsWritten}</b> 기여 편수</span>
          <span><b className="text-gray-900">{profile.worksAuthored.length}</b> 작품 등록</span>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 border-b border-gray-200 mb-4">
        {[{ k: "works", l: "등록 작품" }, { k: "contributions", l: "기여 내역" }].map(t => (
          <button key={t.k} onClick={() => setTab(t.k as "works" | "contributions")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t.k ? "border-violet-600 text-violet-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            {t.l}
          </button>
        ))}
      </div>

      {tab === "works" && (
        <div className="space-y-3">
          {profile.worksAuthored.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">등록한 작품이 없습니다</p>
          ) : profile.worksAuthored.map(w => (
            <Link key={w.id} href={`/works/${w.id}`}>
              <div className="bg-white rounded-xl border border-gray-200 hover:border-violet-200 p-4 transition-colors">
                <div className="flex gap-2 mb-1.5">
                  <GenreBadge genre={w.genre} />
                  <StatusBadge status={w.status} />
                </div>
                <h3 className="font-semibold text-gray-900">{w.title}</h3>
                <p className="text-gray-500 text-sm line-clamp-1">{w.logline}</p>
                <div className="flex gap-3 text-xs text-gray-400 mt-2">
                  <span>♥ {w._count.likes}</span>
                  <span>브랜치 {w._count.branches}</span>
                  <span>조회 {w.views}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {tab === "contributions" && (
        <div className="space-y-3">
          {profile.contributions.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">기여 내역이 없습니다</p>
          ) : profile.contributions.map(c => (
            <Link key={c.workId} href={`/works/${c.workId}`}>
              <div className="bg-white rounded-xl border border-gray-200 hover:border-violet-200 p-4 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex gap-2 mb-1"><GenreBadge genre={c.work.genre} /></div>
                    <h3 className="font-semibold text-gray-900">{c.work.title}</h3>
                    <p className="text-xs text-gray-400 mt-1">{c.segmentCount}편 · {c.totalWords.toLocaleString()}자</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-violet-600">{c.percentage.toFixed(1)}%</p>
                    <p className="text-xs text-gray-400">기여도</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { WorkCard } from "@/components/work/work-card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";

const GENRES = [
  { value: "", label: "전체" },
  { value: "NOVEL", label: "소설" },
  { value: "SCREENPLAY", label: "시나리오" },
  { value: "PLAY", label: "희곡" },
  { value: "MUSICAL", label: "뮤지컬" },
  { value: "VARIETY", label: "예능" },
  { value: "DRAMA", label: "드라마" },
  { value: "LYRICS", label: "작사" },
  { value: "COMPOSITION", label: "작곡" },
  { value: "RESEARCH", label: "연구" },
];

interface Work {
  id: string;
  title: string;
  logline: string;
  genre: string;
  status: string;
  isFeatured: boolean;
  views: number;
  tags: string[];
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
  };
  _count: {
    branches: number;
    contributions: number;
    likes: number;
    comments: number;
  };
}

export default function WorksPage() {
  const { user } = useAuth();
  const [works, setWorks] = useState<Work[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [genre, setGenre] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  async function fetchWorks() {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (genre) params.set("genre", genre);
    if (q) params.set("q", q);

    try {
      const res = await fetch(`/api/works?${params}`);
      const data = await res.json();
      if (data.success) {
        setWorks(data.data.works);
        setTotal(data.data.total);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchWorks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genre, page]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">작품 탐색</h1>
          <p className="text-gray-500 text-sm mt-1">
            총 {total.toLocaleString()}개의 작품
          </p>
        </div>
        {user && (
          <Link href="/works/new">
            <Button>+ 새 작품 시작</Button>
          </Link>
        )}
      </div>

      {/* 검색 & 필터 */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="제목, 소재, 태그 검색..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchWorks()}
          className="flex-1 px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
        />
        <Button variant="secondary" onClick={fetchWorks} size="sm">
          검색
        </Button>
      </div>

      {/* 장르 필터 */}
      <div className="flex flex-wrap gap-2 mb-8">
        {GENRES.map((g) => (
          <button
            key={g.value}
            onClick={() => {
              setGenre(g.value);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              genre === g.value
                ? "bg-violet-600 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:border-violet-300"
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      {/* 작품 목록 */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-48 rounded-xl bg-gray-100 animate-pulse"
            />
          ))}
        </div>
      ) : works.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg mb-4">작품이 없습니다</p>
          {user && (
            <Link href="/works/new">
              <Button>첫 작품 시작하기</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {works.map((work) => (
            <WorkCard key={work.id} work={work} />
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {total > 20 && (
        <div className="flex justify-center gap-2 mt-8">
          <Button
            variant="secondary"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            이전
          </Button>
          <span className="px-4 py-2 text-sm text-gray-600">
            {page} / {Math.ceil(total / 20)}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= Math.ceil(total / 20)}
            onClick={() => setPage((p) => p + 1)}
          >
            다음
          </Button>
        </div>
      )}
    </div>
  );
}

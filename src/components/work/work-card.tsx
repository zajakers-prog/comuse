"use client";

import Link from "next/link";
import { GenreBadge, StatusBadge } from "@/components/ui/badge";

interface WorkCardProps {
  work: {
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
  };
}

export function WorkCard({ work }: WorkCardProps) {
  return (
    <Link href={`/works/${work.id}`}>
      <div className="group bg-white rounded-xl border border-gray-200 hover:border-violet-300 hover:shadow-md transition-all p-5 cursor-pointer">
        {/* 헤더 */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex flex-wrap gap-1.5">
            <GenreBadge genre={work.genre} />
            <StatusBadge status={work.status} />
            {work.isFeatured && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                ★ 추천
              </span>
            )}
          </div>
        </div>

        {/* 제목 */}
        <h3 className="font-semibold text-gray-900 text-base mb-1 group-hover:text-violet-700 transition-colors line-clamp-2">
          {work.title}
        </h3>

        {/* 소재 한 줄 요약 */}
        <p className="text-gray-500 text-sm mb-3 line-clamp-2">{work.logline}</p>

        {/* 태그 */}
        {work.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {work.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="text-xs text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* 작성자 & 통계 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-violet-200 flex items-center justify-center text-xs font-bold text-violet-700">
              {work.author.displayName[0]}
            </div>
            <span className="text-xs text-gray-600">{work.author.displayName}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span>브랜치 {work._count.branches}</span>
            <span>기여자 {work._count.contributions}</span>
            <span>♥ {work._count.likes}</span>
            <span>조회 {work.views}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

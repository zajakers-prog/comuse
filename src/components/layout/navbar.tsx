"use client";

import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function Navbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* 로고 */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-black text-violet-600 tracking-tight">
              CoMuse
            </span>
            <span className="hidden sm:block text-xs text-gray-400 font-medium">
              공동집필 플랫폼
            </span>
          </Link>

          {/* 메뉴 */}
          <div className="flex items-center gap-4">
            <Link
              href="/works"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              작품 탐색
            </Link>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  <div className="w-7 h-7 rounded-full bg-violet-200 flex items-center justify-center text-xs font-bold text-violet-700">
                    {user.displayName[0]}
                  </div>
                  <span className="hidden sm:block">{user.displayName}</span>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                    <Link
                      href="/works/new"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      새 작품 시작
                    </Link>
                    <Link
                      href={`/profile/${user.username}`}
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      내 프로필
                    </Link>
                    <hr className="my-1 border-gray-100" />
                    <button
                      onClick={() => {
                        logout();
                        setMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    로그인
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">시작하기</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

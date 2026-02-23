"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";

const GENRES = [
  { value: "NOVEL", label: "소설" },
  { value: "SCREENPLAY", label: "시나리오" },
  { value: "PLAY", label: "희곡" },
  { value: "MUSICAL", label: "뮤지컬 각본" },
  { value: "VARIETY", label: "예능 각본" },
  { value: "DRAMA", label: "드라마" },
  { value: "LYRICS", label: "작사" },
  { value: "COMPOSITION", label: "작곡/공동작곡" },
  { value: "RESEARCH", label: "공동연구" },
  { value: "OTHER", label: "기타" },
];

export default function NewWorkPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    logline: "",
    description: "",
    genre: "NOVEL",
    tagInput: "",
    tags: [] as string[],
  });

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 mb-4">로그인이 필요합니다</p>
        <Button onClick={() => router.push("/login")}>로그인하기</Button>
      </div>
    );
  }

  function addTag() {
    const tag = form.tagInput.trim().replace(/^#/, "");
    if (tag && !form.tags.includes(tag) && form.tags.length < 10) {
      setForm((f) => ({ ...f, tags: [...f.tags, tag], tagInput: "" }));
    }
  }

  function removeTag(tag: string) {
    setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.logline || !form.genre) {
      setError("제목, 핵심 소재, 장르는 필수입니다");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/works", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: form.title,
          logline: form.logline,
          description: form.description || undefined,
          genre: form.genre,
          tags: form.tags,
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push(`/works/${data.data.id}`);
      } else {
        setError(data.error ?? "오류가 발생했습니다");
      }
    } catch {
      setError("네트워크 오류");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">새 작품 시작</h1>
        <p className="text-gray-500 mt-1 text-sm">
          소재만 있어도 됩니다. 집필자가 찾아올 거예요.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 장르 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            장르 <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((g) => (
              <button
                key={g.value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, genre: g.value }))}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  form.genre === g.value
                    ? "bg-violet-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* 제목 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            제목 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="작품 제목 (미정이면 임시 제목도 OK)"
            maxLength={200}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
          />
        </div>

        {/* 핵심 소재 (logline) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            핵심 소재 한 줄 요약 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={form.logline}
            onChange={(e) => setForm((f) => ({ ...f, logline: e.target.value }))}
            placeholder="예: 2150년, 기억을 팔아 먹고사는 기억 도둑이 자신의 기억을 훔친 의뢰인을 추적하는 이야기"
            maxLength={500}
            rows={3}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm resize-none"
          />
          <p className="text-xs text-gray-400 mt-1">{form.logline.length}/500</p>
        </div>

        {/* 상세 설명 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            상세 설명{" "}
            <span className="text-gray-400 font-normal">(선택)</span>
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="세계관, 주요 등장인물, 원하는 집필 방향 등 자유롭게 작성"
            rows={5}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm resize-none"
          />
        </div>

        {/* 태그 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            태그 <span className="text-gray-400 font-normal">(최대 10개)</span>
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={form.tagInput}
              onChange={(e) => setForm((f) => ({ ...f, tagInput: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder="#판타지, #타임슬립, #반전..."
              className="flex-1 px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
            />
            <Button type="button" variant="secondary" size="sm" onClick={addTag}>
              추가
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {form.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-violet-50 text-violet-700 border border-violet-100"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:text-red-500"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-100 rounded-lg px-4 py-2">
            {error}
          </p>
        )}

        <Button type="submit" loading={loading} size="lg" className="w-full">
          작품 만들기
        </Button>
      </form>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const SEGMENT_TYPES = [
  { value: "IDEA", label: "💡 아이디어/소재" },
  { value: "OPENING", label: "📖 도입부" },
  { value: "BODY", label: "✍️ 본문" },
  { value: "CLIMAX", label: "⚡ 클라이맥스" },
  { value: "ENDING", label: "🎯 결말" },
];

interface SegmentEditorProps {
  branchId: string;
  token: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function SegmentEditor({
  branchId,
  token,
  onClose,
  onSuccess,
}: SegmentEditorProps) {
  const [form, setForm] = useState({
    title: "",
    body: "",
    type: "BODY",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const wordCount = form.body.replace(/\s/g, "").length;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.body.trim()) {
      setError("내용을 입력해주세요");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/segments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          branchId,
          title: form.title || undefined,
          body: form.body,
          type: form.type,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess();
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
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">이야기 이어쓰기</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 역할 유형 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              기여 유형
            </label>
            <div className="flex flex-wrap gap-2">
              {SEGMENT_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, type: t.value }))}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    form.type === t.value
                      ? "bg-violet-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              소제목{" "}
              <span className="text-gray-400 font-normal">(선택, 예: 1장, Act 1)</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="1장, 프롤로그, Act 1 Scene 2..."
              maxLength={200}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
            />
          </div>

          {/* 본문 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              내용 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              placeholder="이야기를 이어 써주세요..."
              rows={12}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm resize-none leading-relaxed font-serif"
            />
            <div className="flex justify-between mt-1">
              <p className="text-xs text-gray-400">
                AI가 기여도를 자동 분석합니다
              </p>
              <p className="text-xs text-gray-400">{wordCount.toLocaleString()}자</p>
            </div>
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-100 rounded-lg px-4 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              취소
            </Button>
            <Button type="submit" loading={loading} className="flex-1">
              게시하기
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

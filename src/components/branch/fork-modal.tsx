"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ForkModalProps {
  workId: string;
  parentBranchId: string;
  afterSegmentId?: string;
  token: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ForkModal({
  workId,
  parentBranchId,
  afterSegmentId,
  token,
  onClose,
  onSuccess,
}: ForkModalProps) {
  const [form, setForm] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("브랜치 이름을 입력해주세요");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/branches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          workId,
          name: form.name,
          description: form.description || undefined,
          parentBranchId,
          forkedAfterSegmentId: afterSegmentId,
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="font-semibold text-gray-900">새 브랜치 만들기</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {afterSegmentId
                ? "선택한 지점 이후 새로운 방향으로 이어집니다"
                : "처음부터 새로운 버전을 시작합니다"}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              브랜치 이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="예: 주인공이 사는 버전, 배경 바꿔보기, 해피엔딩..."
              maxLength={100}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              설명{" "}
              <span className="text-gray-400 font-normal">(선택)</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="이 브랜치에서 어떤 방향으로 이야기를 이어갈 건지..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm resize-none"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-100 rounded-lg px-4 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              취소
            </Button>
            <Button type="submit" loading={loading} className="flex-1">
              브랜치 생성
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

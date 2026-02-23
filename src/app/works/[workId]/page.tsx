"use client";

import { useState, useEffect, use } from "react";
import { useAuth } from "@/context/auth-context";
import { GenreBadge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BranchTree } from "@/components/branch/branch-tree";
import { ContributionChart } from "@/components/work/contribution-chart";
import { SegmentEditor } from "@/components/work/segment-editor";
import { ForkModal } from "@/components/branch/fork-modal";

interface Segment {
  id: string;
  title: string | null;
  body: string;
  order: number;
  type: string;
  wordCount: number;
  authorId: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
  };
  aiScore?: {
    originalityScore: number;
    qualityScore: number;
    impactScore: number;
    coherenceScore: number;
  } | null;
  forkedBranches: Array<{ id: string; name: string; creatorId: string; likes: number }>;
}

interface WorkData {
  id: string;
  title: string;
  logline: string;
  description?: string | null;
  genre: string;
  status: string;
  isFeatured: boolean;
  views: number;
  tags: string[];
  authorId: string;
  author: { id: string; username: string; displayName: string };
  mainBranchId?: string | null;
  mainBranch?: {
    id: string;
    name: string;
    segments: Segment[];
  } | null;
  branches: Array<{
    id: string;
    name: string;
    description?: string | null;
    parentBranchId?: string | null;
    forkedAfterSegmentId?: string | null;
    creatorId: string;
    likes: number;
    status: string;
    createdAt: string;
    creator: { id: string; username: string; displayName: string; avatarUrl?: string | null };
    _count: { segments: number; childBranches: number };
    forkedAfterSegment?: { id: string; title: string | null; order: number } | null;
  }>;
  contributions: Array<{
    userId: string;
    percentage: number;
    segmentCount: number;
    totalWords: number;
    user: {
      id: string;
      username: string;
      displayName: string;
      avatarUrl?: string | null;
      ethAddress?: string | null;
    };
  }>;
  _count: { likes: number; comments: number };
}

export default function WorkDetailPage({
  params,
}: {
  params: Promise<{ workId: string }>;
}) {
  const { workId } = use(params);
  const { user, token } = useAuth();

  const [work, setWork] = useState<WorkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);
  const [activeSegments, setActiveSegments] = useState<Segment[]>([]);
  const [tab, setTab] = useState<"read" | "tree" | "contributions">("read");
  const [showEditor, setShowEditor] = useState(false);
  const [forkModal, setForkModal] = useState<{
    parentBranchId: string;
    afterSegmentId?: string;
  } | null>(null);

  async function loadWork() {
    const res = await fetch(`/api/works/${workId}`);
    const data = await res.json();
    if (data.success) {
      setWork(data.data);
      const mb = data.data.mainBranch;
      if (mb) {
        setActiveBranchId(mb.id);
        setActiveSegments(mb.segments ?? []);
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    loadWork();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workId]);

  async function loadBranch(branchId: string) {
    const res = await fetch(`/api/branches?workId=${workId}`);
    const data = await res.json();
    if (!data.success) return;

    // 브랜치의 segments를 가져오기 위해 작품 상세를 다시 활용
    // (실제로는 /api/branches/:id 엔드포인트를 쓰는 게 좋지만, 간소화)
    const allBranches = flattenBranches(data.data);
    const branch = allBranches.find((b: { id: string }) => b.id === branchId);
    if (branch) {
      setActiveBranchId(branchId);
    }
  }

  function flattenBranches(nodes: { id: string; children?: { id: string }[] }[]): { id: string }[] {
    const result: { id: string }[] = [];
    for (const node of nodes) {
      result.push(node);
      if (node.children) result.push(...flattenBranches(node.children as { id: string; children?: { id: string }[] }[]));
    }
    return result;
  }

  function buildBranchTree(work: WorkData) {
    const mainBranch = work.mainBranch
      ? {
          id: work.mainBranch.id,
          name: work.mainBranch.name,
          description: null,
          parentBranchId: null,
          forkedAfterSegmentId: null,
          creatorId: work.authorId,
          likes: 0,
          status: "ACTIVE",
          createdAt: "",
          creator: work.author as { id: string; username: string; displayName: string; avatarUrl?: string | null | undefined },
          _count: { segments: work.mainBranch.segments.length, childBranches: 0 },
          forkedAfterSegment: null,
          children: [] as unknown[],
        }
      : null;

    const otherBranches = work.branches.map((b) => ({
      ...b,
      children: [] as unknown[],
    }));

    if (!mainBranch) return otherBranches;

    // 메인 브랜치를 루트로 트리 구성
    const all = [mainBranch, ...otherBranches];
    return buildTree(all as Parameters<typeof buildTree>[0]);
  }

  function buildTree(branches: Array<{ id: string; parentBranchId: string | null; children: unknown[] }>) {
    const map = new Map(branches.map((b) => [b.id, { ...b, children: [] as typeof branches }]));
    const roots: typeof branches = [];
    for (const b of Array.from(map.values())) {
      if (b.parentBranchId) {
        const p = map.get(b.parentBranchId);
        if (p) p.children.push(b);
      } else {
        roots.push(b);
      }
    }
    return roots;
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (!work) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-400">작품을 찾을 수 없습니다</p>
      </div>
    );
  }

  const branchTree = buildBranchTree(work);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 작품 헤더 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <GenreBadge genre={work.genre} />
          <StatusBadge status={work.status} />
          {work.isFeatured && (
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
              ★ 추천
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">
          {work.title}
        </h1>
        <p className="text-gray-600 mb-4">{work.logline}</p>

        {work.description && (
          <p className="text-gray-500 text-sm mb-4 bg-gray-50 rounded-lg p-3">
            {work.description}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span>by @{work.author.username}</span>
            <span>·</span>
            <span>브랜치 {work.branches.length + 1}개</span>
            <span>·</span>
            <span>기여자 {work.contributions.length}명</span>
            <span>·</span>
            <span>♥ {work._count.likes}</span>
          </div>

          {user && work.status === "OPEN" && (
            <Button
              onClick={() => setShowEditor(true)}
              size="sm"
            >
              + 이어 쓰기
            </Button>
          )}
        </div>

        {/* 태그 */}
        {work.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {work.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 탭 */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {[
          { key: "read", label: "읽기" },
          { key: "tree", label: `브랜치 트리 (${work.branches.length + 1})` },
          { key: "contributions", label: `기여도` },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as "read" | "tree" | "contributions")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.key
                ? "border-violet-600 text-violet-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 콘텐츠 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 메인 콘텐츠 */}
        <div className="lg:col-span-3">
          {tab === "read" && (
            <div className="space-y-6">
              {activeSegments.length === 0 ? (
                <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
                  <p className="text-gray-400 mb-4">아직 내용이 없습니다</p>
                  {user && (
                    <Button onClick={() => setShowEditor(true)} variant="secondary">
                      첫 번째로 이어 쓰기
                    </Button>
                  )}
                </div>
              ) : (
                activeSegments.map((seg) => (
                  <SegmentCard
                    key={seg.id}
                    segment={seg}
                    onFork={(segId) =>
                      setForkModal({
                        parentBranchId: activeBranchId!,
                        afterSegmentId: segId,
                      })
                    }
                  />
                ))
              )}

              {user && work.status === "OPEN" && activeSegments.length > 0 && (
                <div className="bg-white rounded-xl border border-dashed border-gray-300 p-6 text-center">
                  <p className="text-gray-400 text-sm mb-3">
                    이야기를 이어 쓰세요
                  </p>
                  <Button onClick={() => setShowEditor(true)} variant="secondary" size="sm">
                    + Segment 추가
                  </Button>
                </div>
              )}
            </div>
          )}

          {tab === "tree" && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                브랜치 트리
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                같은 소재 위에 여러 버전의 이야기가 존재합니다.
                마음에 드는 지점에서 fork 버튼을 눌러 새로운 가지를 만드세요.
              </p>
              <BranchTree
                branches={branchTree as Parameters<typeof BranchTree>[0]["branches"]}
                activeBranchId={activeBranchId ?? undefined}
                onSelectBranch={(id) => {
                  setActiveBranchId(id);
                  loadBranch(id);
                  setTab("read");
                }}
                workId={workId}
                onFork={(parentId, afterSegId) => {
                  setForkModal({ parentBranchId: parentId, afterSegmentId: afterSegId });
                }}
              />
            </div>
          )}

          {tab === "contributions" && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-2">AI 기여도 분석</h3>
              <p className="text-sm text-gray-500 mb-6">
                Claude AI가 각 기여의 독창성·품질·영향도·연결성을 분석해 실시간으로 계산합니다.
                IP 판매 시 이 비율대로 이더리움 스마트 컨트랙트를 통해 자동 배분됩니다.
              </p>
              <ContributionChart contributions={work.contributions} />
            </div>
          )}
        </div>

        {/* 사이드바 - 브랜치 트리 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-20">
            <h3 className="font-semibold text-gray-700 text-sm mb-3">
              브랜치
            </h3>
            <BranchTree
              branches={branchTree as Parameters<typeof BranchTree>[0]["branches"]}
              activeBranchId={activeBranchId ?? undefined}
              onSelectBranch={(id) => {
                setActiveBranchId(id);
                loadBranch(id);
                if (tab !== "read") setTab("read");
              }}
              workId={workId}
              onFork={(parentId, afterSegId) =>
                setForkModal({ parentBranchId: parentId, afterSegmentId: afterSegId })
              }
            />

            {user && work.status === "OPEN" && (
              <button
                onClick={() =>
                  setForkModal({ parentBranchId: work.mainBranchId ?? "" })
                }
                className="mt-3 w-full text-xs text-violet-600 hover:text-violet-800 py-1.5 border border-dashed border-violet-200 rounded-lg hover:border-violet-400 transition-colors"
              >
                + 새 브랜치 만들기
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 이어쓰기 에디터 모달 */}
      {showEditor && activeBranchId && (
        <SegmentEditor
          branchId={activeBranchId}
          token={token!}
          onClose={() => setShowEditor(false)}
          onSuccess={() => {
            setShowEditor(false);
            loadWork();
          }}
        />
      )}

      {/* 브랜치 포크 모달 */}
      {forkModal && (
        <ForkModal
          workId={workId}
          parentBranchId={forkModal.parentBranchId}
          afterSegmentId={forkModal.afterSegmentId}
          token={token!}
          onClose={() => setForkModal(null)}
          onSuccess={() => {
            setForkModal(null);
            loadWork();
          }}
        />
      )}
    </div>
  );
}

function SegmentCard({
  segment,
  onFork,
}: {
  segment: Segment;
  onFork: (segId: string) => void;
}) {
  const TYPE_LABELS: Record<string, string> = {
    IDEA: "아이디어",
    OPENING: "도입부",
    BODY: "본문",
    CLIMAX: "클라이맥스",
    ENDING: "결말",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500">
            {TYPE_LABELS[segment.type] ?? segment.type}
          </span>
          {segment.title && (
            <>
              <span className="text-gray-300">·</span>
              <span className="text-sm font-semibold text-gray-700">
                {segment.title}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center text-xs font-bold text-violet-600">
              {segment.author.displayName[0]}
            </div>
            <span className="text-xs text-gray-500">
              {segment.author.displayName}
            </span>
          </div>
          <span className="text-xs text-gray-400">
            {segment.wordCount.toLocaleString()}자
          </span>
          {segment.aiScore && (
            <span
              className="text-xs text-violet-500 font-medium"
              title="AI 품질 점수"
            >
              AI {Math.round(segment.aiScore.qualityScore * 100)}
            </span>
          )}
        </div>
      </div>

      <div className="px-5 py-5">
        <div className="prose-comuse whitespace-pre-wrap text-gray-800">
          {segment.body}
        </div>
      </div>

      {/* 이 지점 이후 포크 & 기존 포크된 브랜치 표시 */}
      <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {segment.forkedBranches.map((fb) => (
            <span
              key={fb.id}
              className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full"
            >
              ⎇ {fb.name}
            </span>
          ))}
        </div>
        <button
          onClick={() => onFork(segment.id)}
          className="text-xs text-gray-400 hover:text-violet-600 transition-colors"
          title="이 지점 이후에서 새 브랜치 만들기"
        >
          여기서 분기 →
        </button>
      </div>
    </div>
  );
}

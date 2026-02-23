"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface BranchNode {
  id: string;
  name: string;
  description?: string | null;
  creator: { id: string; username: string; displayName: string };
  _count: { segments: number; childBranches: number };
  forkedAfterSegment?: { id: string; title: string | null; order: number } | null;
  likes: number;
  status: string;
  children: BranchNode[];
}

interface BranchTreeProps {
  branches: BranchNode[];
  activeBranchId?: string;
  onSelectBranch: (branchId: string) => void;
  workId: string;
  onFork: (parentBranchId: string, afterSegmentId?: string) => void;
}

export function BranchTree({
  branches,
  activeBranchId,
  onSelectBranch,
  onFork,
}: BranchTreeProps) {
  return (
    <div className="space-y-1">
      {branches.map((branch) => (
        <BranchNode
          key={branch.id}
          branch={branch}
          depth={0}
          activeBranchId={activeBranchId}
          onSelectBranch={onSelectBranch}
          onFork={onFork}
        />
      ))}
    </div>
  );
}

function BranchNode({
  branch,
  depth,
  activeBranchId,
  onSelectBranch,
  onFork,
}: {
  branch: BranchNode;
  depth: number;
  activeBranchId?: string;
  onSelectBranch: (id: string) => void;
  onFork: (parentBranchId: string, afterSegmentId?: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const isActive = branch.id === activeBranchId;
  const hasChildren = branch.children.length > 0;

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer group",
          "hover:bg-gray-50 transition-colors",
          isActive && "bg-violet-50 border border-violet-200"
        )}
        style={{ paddingLeft: `${12 + depth * 20}px` }}
      >
        {/* 트리 연결선 */}
        {depth > 0 && (
          <span className="text-gray-300 text-xs font-mono">└─</span>
        )}

        {/* 확장/축소 버튼 */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((v) => !v);
            }}
            className="text-gray-400 hover:text-gray-600 w-4 text-xs"
          >
            {expanded ? "▾" : "▸"}
          </button>
        ) : (
          <span className="w-4" />
        )}

        {/* 브랜치 이름 */}
        <button
          onClick={() => onSelectBranch(branch.id)}
          className={cn(
            "flex-1 text-left text-sm font-medium",
            isActive ? "text-violet-700" : "text-gray-700 hover:text-gray-900"
          )}
        >
          <span className="text-gray-400 mr-1">⎇</span>
          {branch.name}
          {branch.forkedAfterSegment && (
            <span className="ml-1.5 text-xs text-gray-400 font-normal">
              (#{branch.forkedAfterSegment.order} 이후)
            </span>
          )}
        </button>

        {/* 통계 & 포크 버튼 */}
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-xs text-gray-400">{branch._count.segments}편</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFork(branch.id);
            }}
            className="text-xs text-violet-500 hover:text-violet-700 px-1.5 py-0.5 rounded border border-violet-200 hover:border-violet-400 transition-colors"
            title="이 브랜치에서 가지치기"
          >
            fork
          </button>
        </div>
      </div>

      {/* 하위 브랜치 */}
      {hasChildren && expanded && (
        <div>
          {branch.children.map((child) => (
            <BranchNode
              key={child.id}
              branch={child}
              depth={depth + 1}
              activeBranchId={activeBranchId}
              onSelectBranch={onSelectBranch}
              onFork={onFork}
            />
          ))}
        </div>
      )}
    </div>
  );
}

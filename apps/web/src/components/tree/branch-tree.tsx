'use client';

import { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  type Node,
  type Edge,
  Position,
  Handle,
  useNodesState,
  useEdgesState,
  MiniMap,
  Controls,
  Background,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useRouter } from 'next/navigation';

interface BranchData {
  id: string;
  title: string;
  author_name: string;
  completion_percent: number;
  parent_branch_id: string | null;
}

interface BranchTreeProps {
  projectId: string;
  branches: BranchData[];
}

function BranchNode({ data }: { data: any }) {
  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg p-3 min-w-[180px] shadow-sm hover:border-primary-400 hover:shadow-md transition cursor-pointer">
      <Handle type="target" position={Position.Top} className="!bg-gray-400" />
      <div className="text-sm font-semibold truncate">{data.title}</div>
      <div className="text-xs text-gray-500 mt-1">{data.author_name}</div>
      <div className="mt-2 flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full">
          <div
            className="h-full bg-primary-500 rounded-full transition-all"
            style={{ width: `${data.completion_percent}%` }}
          />
        </div>
        <span className="text-xs text-gray-400">{data.completion_percent}%</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-gray-400" />
    </div>
  );
}

const nodeTypes = { branch: BranchNode };

function layoutTree(branches: BranchData[]): { nodes: Node[]; edges: Edge[] } {
  const childrenMap = new Map<string | null, BranchData[]>();
  branches.forEach((b) => {
    const parentKey = b.parent_branch_id ?? '__root__';
    if (!childrenMap.has(parentKey)) childrenMap.set(parentKey, []);
    childrenMap.get(parentKey)!.push(b);
  });

  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const X_GAP = 220;
  const Y_GAP = 120;

  let xOffset = 0;

  function traverse(branchId: string | null, depth: number): number {
    const children = childrenMap.get(branchId ?? '__root__') ?? [];
    if (children.length === 0) return xOffset;

    let startX = xOffset;
    children.forEach((child, i) => {
      const childX = xOffset;

      nodes.push({
        id: child.id,
        type: 'branch',
        position: { x: childX * X_GAP, y: depth * Y_GAP },
        data: {
          title: child.title,
          author_name: child.author_name,
          completion_percent: child.completion_percent,
        },
      });

      if (child.parent_branch_id) {
        edges.push({
          id: `${child.parent_branch_id}-${child.id}`,
          source: child.parent_branch_id,
          target: child.id,
          type: 'smoothstep',
        });
      }

      traverse(child.id, depth + 1);
      xOffset++;
    });

    return startX;
  }

  traverse(null, 0);
  return { nodes, edges };
}

export function BranchTree({ projectId, branches }: BranchTreeProps) {
  const router = useRouter();
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => layoutTree(branches),
    [branches]
  );

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClick = useCallback(
    (_: any, node: Node) => {
      router.push(`/projects/${projectId}/branches/${node.id}`);
    },
    [router, projectId]
  );

  if (branches.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400 border border-dashed border-gray-200 rounded-lg">
        No branches to visualize yet.
      </div>
    );
  }

  return (
    <div className="h-[500px] border border-gray-200 rounded-lg overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.3}
        maxZoom={1.5}
      >
        <Controls />
        <MiniMap />
        <Background />
      </ReactFlow>
    </div>
  );
}

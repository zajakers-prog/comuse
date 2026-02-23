import { cn } from "@/lib/utils";

const GENRE_LABELS: Record<string, string> = {
  NOVEL: "소설",
  SCREENPLAY: "시나리오",
  PLAY: "희곡",
  MUSICAL: "뮤지컬",
  VARIETY: "예능",
  DRAMA: "드라마",
  LYRICS: "작사",
  COMPOSITION: "작곡",
  RESEARCH: "연구",
  OTHER: "기타",
};

const GENRE_COLORS: Record<string, string> = {
  NOVEL: "bg-blue-100 text-blue-700",
  SCREENPLAY: "bg-orange-100 text-orange-700",
  PLAY: "bg-green-100 text-green-700",
  MUSICAL: "bg-pink-100 text-pink-700",
  VARIETY: "bg-yellow-100 text-yellow-700",
  DRAMA: "bg-red-100 text-red-700",
  LYRICS: "bg-purple-100 text-purple-700",
  COMPOSITION: "bg-indigo-100 text-indigo-700",
  RESEARCH: "bg-gray-100 text-gray-700",
  OTHER: "bg-gray-100 text-gray-700",
};

export function GenreBadge({ genre }: { genre: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        GENRE_COLORS[genre] ?? "bg-gray-100 text-gray-700"
      )}
    >
      {GENRE_LABELS[genre] ?? genre}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    OPEN: { label: "모집 중", color: "bg-green-100 text-green-700" },
    IN_PROGRESS: { label: "진행 중", color: "bg-blue-100 text-blue-700" },
    COMPLETED: { label: "완성", color: "bg-gray-100 text-gray-700" },
    SOLD: { label: "IP 판매됨", color: "bg-amber-100 text-amber-700" },
    ARCHIVED: { label: "보관", color: "bg-gray-100 text-gray-500" },
  };
  const { label, color } = map[status] ?? { label: status, color: "bg-gray-100 text-gray-700" };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        color
      )}
    >
      {label}
    </span>
  );
}

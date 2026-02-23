import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function countWords(text: string): number {
  // 한국어 + 영어 혼합 단어 수 계산
  const korean = (text.match(/[\uAC00-\uD7A3]/g) ?? []).length;
  const english = (text.match(/\b[a-zA-Z]+\b/g) ?? []).length;
  return korean + english;
}

export function countCharacters(text: string): number {
  return text.replace(/\s/g, "").length;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function paginate(page: number, limit: number) {
  const skip = (Math.max(1, page) - 1) * limit;
  return { skip, take: limit };
}

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-black text-violet-600 mb-4">404</h1>
        <p className="text-gray-500 mb-8">페이지를 찾을 수 없습니다</p>
        <Link href="/">
          <Button>홈으로 돌아가기</Button>
        </Link>
      </div>
    </div>
  );
}

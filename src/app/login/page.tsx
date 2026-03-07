"use client";

import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-sm rounded-xl border-[1.5px] border-gray-200 bg-white px-8 py-10 text-center shadow-sm">
        {/* Branding */}
        <div className="mb-1 flex items-center justify-center gap-2">
          <div className="h-3 w-3 rounded-full bg-indigo-600" />
          <span className="text-xl font-extrabold text-gray-900">ArchFlow</span>
        </div>
        <p className="mb-8 text-xs text-gray-400">
          AWS {"\uC544\uD0A4\uD14D\uCC98"} {"\uC124\uACC4"} {"\uAC00\uC774\uB4DC"}
        </p>

        {/* Google Login */}
        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="flex w-full items-center justify-center gap-2.5 rounded-lg border-[1.5px] border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <svg className="h-4.5 w-4.5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google{"\uB85C"} {"\uB85C\uADF8\uC778"}
        </button>

        <div className="mt-4">
          <button
            onClick={() => router.push("/")}
            className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-gray-400 transition-colors hover:text-gray-600 hover:bg-gray-50"
          >
            비회원으로 이용하기
          </button>
        </div>

        <p className="mt-5 text-[11px] leading-relaxed text-gray-400">
          로그인 시{" "}
          <a href="/privacy" target="_blank" className="underline hover:text-gray-600">
            개인정보처리방침
          </a>
          에 동의한 것으로 간주됩니다.
        </p>
        <p className="mt-1 text-[11px] text-gray-300">
          비회원은 설계 저장 기능을 이용할 수 없습니다
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { signIn } from "next-auth/react";
import { useDict } from "@/lib/i18n/context";

interface LoginModalProps {
  onClose: () => void;
}

export function LoginModal({ onClose }: LoginModalProps) {
  const t = useDict();
  const [agreed, setAgreed] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Escape key to close + focus trap
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    // Focus first focusable element on open
    const timer = setTimeout(() => {
      dialogRef.current?.querySelector<HTMLElement>("button, input")?.focus();
    }, 50);
    return () => { document.removeEventListener("keydown", handleKeyDown); clearTimeout(timer); };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t.result.loginRequired}
    >
      <div
        ref={dialogRef}
        className="relative w-[90%] max-w-sm rounded-2xl bg-white p-8 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* X close button */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="mb-2 flex items-center justify-center gap-2">
          <div className="h-3 w-3 rounded-full bg-indigo-600" />
          <span className="text-lg font-extrabold text-gray-900">ArchFlow</span>
        </div>
        <p className="mb-1 text-sm font-bold text-gray-900">{t.result.loginRequired}</p>
        <p className="mb-5 text-xs text-gray-500">{t.result.loginRequiredDesc}</p>

        {/* Guest notice — prominent */}
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
          <p className="text-[12px] font-semibold text-amber-700">{t.login.guestNotice}</p>
        </div>

        {/* Privacy consent */}
        <div className="mb-4 flex items-start gap-2 text-left">
          <input
            id="login-modal-agree"
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-gray-300 accent-indigo-600"
          />
          <label htmlFor="login-modal-agree" className="cursor-pointer text-[12px] leading-relaxed text-gray-500">
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-indigo-600 underline hover:text-indigo-800"
              onClick={(e) => e.stopPropagation()}
            >
              {t.login.privacyLink}
            </a>
            {t.login.privacyAgree}{" "}
            <span className="text-red-400">{t.login.required}</span>
          </label>
        </div>

        {/* Google Login */}
        <button
          onClick={() => signIn("google", { callbackUrl: window.location.href })}
          disabled={!agreed}
          className={`flex w-full items-center justify-center gap-2.5 rounded-lg border-[1.5px] px-4 py-3 text-sm font-medium transition-colors ${
            agreed
              ? "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 cursor-pointer"
              : "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed"
          }`}
        >
          <svg className="h-4.5 w-4.5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill={agreed ? "#4285F4" : "#ccc"} />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill={agreed ? "#34A853" : "#ccc"} />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill={agreed ? "#FBBC05" : "#ccc"} />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill={agreed ? "#EA4335" : "#ccc"} />
          </svg>
          {t.result.googleLogin}
        </button>
      </div>
    </div>
  );
}

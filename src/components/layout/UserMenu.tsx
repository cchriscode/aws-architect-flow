"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { useDict } from "@/lib/i18n/context";

export function UserMenu() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const t = useDict();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!session?.user) {
    return (
      <>
        <div className="mx-2.5 h-5 w-px bg-gray-200" />
        <button
          onClick={() => signIn("google")}
          className="rounded-lg border-[1.5px] border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 transition-colors hover:bg-indigo-100"
        >
          {t.userMenu.login}
        </button>
      </>
    );
  }

  const { name, image } = session.user;

  return (
    <div ref={ref} className="relative flex items-center">
      <div className="mx-2.5 h-5 w-px bg-gray-200" />
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-50"
      >
        {image ? (
          <img
            src={image}
            alt=""
            className="h-6 w-6 rounded-full"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-600">
            {name?.charAt(0) || "?"}
          </div>
        )}
        <span className="max-w-[80px] truncate font-medium">{name}</span>
        <span className="text-[10px] text-gray-400">{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[120px] rounded-lg border-[1.5px] border-gray-200 bg-white py-1 shadow-lg">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full px-3.5 py-2 text-left text-xs text-gray-600 transition-colors hover:bg-gray-50"
          >
            {t.userMenu.logout}
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getHistoryCount } from "@/lib/history";
import { UserMenu } from "@/components/layout/UserMenu";
import { useDict, useLang } from "@/lib/i18n/context";
import { ClipboardList } from "lucide-react";

interface HeaderProps {
  onLoginClick?: () => void;
}

export function Header({ onLoginClick }: HeaderProps) {
  const t = useDict();
  const { lang, setLang } = useLang();
  const [historyCount, setHistoryCount] = useState(0);

  useEffect(() => {
    getHistoryCount().then(setHistoryCount);
  }, []);

  return (
    <div className="flex items-center justify-between border-b border-gray-200 bg-white px-3 py-3.5 md:px-7">
      <div className="flex items-center gap-2.5">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-2.5 w-2.5 rounded-full bg-indigo-600" />
          <span className="text-sm font-extrabold text-gray-900 md:text-base">
            ArchFlow
          </span>
          <span className="hidden text-xs text-gray-400 md:inline">
            {t.header.subtitle}
          </span>
        </Link>
        <Link
          href="/history"
          className="ml-2 flex items-center gap-1 rounded-lg border-[1.5px] border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
        >
          <ClipboardList className="h-3.5 w-3.5 text-gray-500" />
          {t.header.historyLink}
          {historyCount > 0 && (
            <span className="rounded-full bg-indigo-600 px-1.5 py-px text-[10px] font-bold text-white">
              {historyCount}
            </span>
          )}
        </Link>
        <Link
          href="/glossary"
          className="flex items-center gap-1 rounded-lg border-[1.5px] border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
        >
          {t.header.glossaryLink}
        </Link>
        <Link
          href="/blog"
          className="flex items-center gap-1 rounded-lg border-[1.5px] border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
        >
          {t.header.blogLink}
        </Link>
      </div>
      <div className="flex items-center gap-2">
        {/* Language toggle */}
        <div className="flex overflow-hidden rounded-md border border-gray-200">
          <button
            onClick={() => setLang("ko")}
            className={`px-2.5 py-1.5 text-xs font-bold transition-colors ${
              lang === "ko"
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-500 hover:bg-gray-50"
            }`}
          >
            KO
          </button>
          <button
            onClick={() => setLang("en")}
            className={`px-2.5 py-1.5 text-xs font-bold transition-colors ${
              lang === "en"
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-500 hover:bg-gray-50"
            }`}
          >
            EN
          </button>
        </div>
        <UserMenu onLoginClick={onLoginClick} />
      </div>
    </div>
  );
}

"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { Locale, Dict } from "./types";
import { ko } from "./ko";
import { en } from "./en";

const DICTS: Record<Locale, Dict> = { ko, en };

const LangCtx = createContext<{
  lang: Locale;
  setLang: (l: Locale) => void;
  t: Dict;
}>({ lang: "ko", setLang: () => {}, t: ko });

/** Cookie name used to persist locale for SSR */
export const LANG_COOKIE = "archflow_lang";

function readLangCookie(): Locale | null {
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${LANG_COOKIE}=([^;]+)`));
    const val = match?.[1];
    if (val === "ko" || val === "en") return val;
  } catch { /* SSR — no document */ }
  return null;
}

export function LangProvider({ initialLang, children }: { initialLang?: Locale; children: ReactNode }) {
  const [lang, setLangState] = useState<Locale>(initialLang ?? "ko");

  useEffect(() => {
    // On client mount, check cookie → localStorage → browser detection
    const fromCookie = readLangCookie();
    if (fromCookie) { setLangState(fromCookie); return; }
    const saved = localStorage.getItem("archflow_lang") as Locale | null;
    if (saved === "en" || saved === "ko") {
      setLangState(saved);
      return;
    }
    // Auto-detect: show English for non-Korean browsers
    const browserLang = navigator.language || "";
    if (!browserLang.startsWith("ko")) setLangState("en");
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  function setLang(l: Locale) {
    setLangState(l);
    localStorage.setItem("archflow_lang", l);
    // Set cookie (1 year, SameSite=Lax) so server can read it on next request
    document.cookie = `${LANG_COOKIE}=${l};path=/;max-age=31536000;SameSite=Lax`;
  }

  return (
    <LangCtx.Provider value={{ lang, setLang, t: DICTS[lang] }}>
      {children}
    </LangCtx.Provider>
  );
}

/** Get current locale + setter */
export function useLang() {
  const { lang, setLang } = useContext(LangCtx);
  return { lang, setLang };
}

/** Get the full UI dictionary */
export function useDict() {
  return useContext(LangCtx).t;
}

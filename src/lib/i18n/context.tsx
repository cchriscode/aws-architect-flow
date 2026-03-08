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

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Locale>("ko");

  useEffect(() => {
    const saved = localStorage.getItem("archflow_lang") as Locale | null;
    if (saved === "en" || saved === "ko") setLangState(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  function setLang(l: Locale) {
    setLangState(l);
    localStorage.setItem("archflow_lang", l);
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

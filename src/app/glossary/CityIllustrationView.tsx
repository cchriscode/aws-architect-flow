"use client";

import dynamic from "next/dynamic";
import type { Dict } from "@/lib/i18n/types";

const City3DScene = dynamic(() => import("./city3d/City3DScene"), {
  ssr: false,
  loading: () => (
    <div className="mt-5 flex h-[70vh] items-center justify-center rounded-xl border border-gray-200 bg-gray-50">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
        <p className="mt-3 text-sm text-gray-500">Loading 3D City...</p>
      </div>
    </div>
  ),
});

export function CityIllustrationView({ lang, t }: { lang: "ko" | "en"; t: Dict }) {
  return <City3DScene lang={lang} t={t} />;
}

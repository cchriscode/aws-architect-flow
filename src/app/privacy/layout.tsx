import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: "ArchFlow 개인정보처리방침 — 수집하는 정보, 이용 목적, 보관 기간 안내.",
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}

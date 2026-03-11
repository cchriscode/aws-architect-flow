import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "설계 히스토리 | Design History",
  description:
    "저장한 AWS 아키텍처 설계를 관리하세요. Manage your saved AWS architecture designs.",
};

export default function HistoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}

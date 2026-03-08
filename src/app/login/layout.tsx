import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "로그인",
  description: "ArchFlow에 로그인하여 AWS 아키텍처 설계를 저장하고 관리하세요.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}

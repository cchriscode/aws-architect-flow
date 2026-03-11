import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AWS 용어사전 | AWS Glossary",
  description:
    "AWS 서비스와 인프라 용어를 쉬운 비유와 함께 학습하세요. Learn AWS services and infrastructure terms with easy analogies.",
};

export default function GlossaryLayout({ children }: { children: React.ReactNode }) {
  return children;
}

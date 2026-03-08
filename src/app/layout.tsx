import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SessionProvider } from "@/components/auth/SessionProvider";
import { LangProvider } from "@/lib/i18n/context";
import "./globals.css";

const SITE_URL = "https://archflow-aws.online";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ArchFlow — AWS 아키텍처 설계 가이드",
    template: "%s | ArchFlow",
  },
  description:
    "14단계 위자드로 AWS 아키텍처를 설계하세요. VPC, 서브넷, 보안 그룹, IAM, 비용 추정까지 한 번에 완성합니다.",
  keywords: [
    "AWS",
    "아키텍처",
    "설계",
    "클라우드",
    "인프라",
    "VPC",
    "Terraform",
    "CDK",
    "AWS architecture",
    "cloud design",
  ],
  openGraph: {
    title: "ArchFlow — AWS 아키텍처 설계 가이드",
    description:
      "14단계 위자드로 AWS 아키텍처를 설계하세요. 다이어그램, IaC 코드, 비용 추정까지 한 번에.",
    url: SITE_URL,
    siteName: "ArchFlow",
    type: "website",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: "ArchFlow — AWS 아키텍처 설계 가이드",
    description:
      "14단계 위자드로 AWS 아키텍처를 설계하세요. 다이어그램, IaC 코드, 비용 추정까지 한 번에.",
  },
  alternates: {
    languages: {
      "ko-KR": SITE_URL,
      "en-US": SITE_URL,
    },
  },
  verification: {
    google: "H-6NTQxrbYjijMfxSlv7b4NJcQAQN-sewk2vpH_tq4Q",
    // naver는 아래 <meta> 태그로 직접 추가
  },
  icons: { icon: "/favicon.ico" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "ArchFlow",
  url: SITE_URL,
  description:
    "14단계 위자드를 통해 AWS 클라우드 아키텍처를 설계하고, 다이어그램·IaC 코드·비용 추정을 생성하는 무료 웹 도구입니다.",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web",
  inLanguage: ["ko", "en"],
  offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        {/* Naver Search Advisor 인증 — 등록 후 content 값 교체 */}
        <meta name="naver-site-verification" content="0681bb0eb39562434527cbbecadb5be306e4eb66" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-[Pretendard,sans-serif] antialiased">
        <SessionProvider>
          <LangProvider>{children}</LangProvider>
        </SessionProvider>
        <Analytics />
      </body>
    </html>
  );
}

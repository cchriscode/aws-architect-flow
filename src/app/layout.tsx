import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Analytics } from "@vercel/analytics/next";
import { SessionProvider } from "@/components/auth/SessionProvider";
import { LangProvider, LANG_COOKIE } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/types";
import "./globals.css";

const SITE_URL = "https://archflow-aws.online";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ArchFlow — AWS Architecture Design Guide | AWS 아키텍처 설계 가이드",
    template: "%s | ArchFlow",
  },
  description:
    "Design AWS architecture with a 14-step wizard. VPC, Subnet, Security Groups, IAM, Terraform code, cost estimation — all in one. 14단계 위자드로 AWS 아키텍처를 설계하세요.",
  keywords: [
    "AWS",
    "AWS architecture",
    "AWS architecture design",
    "AWS architecture diagram",
    "AWS infrastructure",
    "cloud architecture",
    "cloud design tool",
    "AWS Well-Architected",
    "Terraform",
    "CDK",
    "VPC",
    "EKS",
    "ECS",
    "serverless",
    "AWS cost calculator",
    "infrastructure as code",
    "아키텍처",
    "설계",
    "클라우드",
    "인프라",
    "AWS 설계 도구",
  ],
  openGraph: {
    title: "ArchFlow — AWS Architecture Design Guide",
    description:
      "Design AWS architecture with a 14-step wizard. Diagrams, Terraform code, cost estimation, and Well-Architected review — all in one free tool.",
    url: SITE_URL,
    siteName: "ArchFlow",
    type: "website",
    locale: "ko_KR",
    alternateLocale: "en_US",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "ArchFlow — AWS Architecture Design Guide" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ArchFlow — AWS Architecture Design Guide",
    description:
      "Design AWS architecture with a 14-step wizard. Diagrams, Terraform code, cost estimation, and Well-Architected review — all free.",
    images: ["/twitter-image"],
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      "ko-KR": SITE_URL,
      "en-US": SITE_URL,
      "x-default": SITE_URL,
    },
  },
  verification: {
    google: "H-6NTQxrbYjijMfxSlv7b4NJcQAQN-sewk2vpH_tq4Q",
    // naver는 아래 <meta> 태그로 직접 추가
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  other: {
    "theme-color": "#0f172a",
  },
};

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "ArchFlow",
    url: SITE_URL,
    description:
      "Free AWS architecture design tool with a 14-step wizard. Generates diagrams, Terraform/CDK code, security groups, cost estimation, and Well-Architected review.",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    inLanguage: ["ko", "en"],
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    author: { "@type": "Organization", name: "ArchFlow" },
    featureList: [
      "14-step AWS architecture wizard",
      "VPC & Subnet designer",
      "Security Group rule builder",
      "IAM policy generator",
      "Terraform / CDK code export",
      "Monthly cost estimation",
      "Well-Architected Framework review",
      "Architecture diagram sharing",
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "AWS Glossary", item: `${SITE_URL}/glossary` },
      { "@type": "ListItem", position: 3, name: "Tech Blog", item: `${SITE_URL}/blog` },
    ],
  },
];

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const langCookie = cookieStore.get(LANG_COOKIE)?.value;
  const initialLang: Locale = langCookie === "en" ? "en" : "ko";

  return (
    <html lang={initialLang} suppressHydrationWarning>
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
          <LangProvider initialLang={initialLang}>{children}</LangProvider>
        </SessionProvider>
        <Analytics />
      </body>
    </html>
  );
}

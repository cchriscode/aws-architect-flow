import type { Metadata } from "next";

const SITE_URL = "https://archflow-aws.online";

export const metadata: Metadata = {
  title: "Tech Blog | 기술 블로그",
  description:
    "AWS 아키텍처, 클라우드 엔지니어링 인사이트와 실전 가이드. AWS architecture and cloud engineering insights.",
  openGraph: {
    title: "Tech Blog — ArchFlow",
    description:
      "AWS 아키텍처, 클라우드 엔지니어링 인사이트와 실전 가이드.",
    url: `${SITE_URL}/blog`,
    siteName: "ArchFlow",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "ArchFlow Tech Blog" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tech Blog — ArchFlow",
    description:
      "AWS 아키텍처, 클라우드 엔지니어링 인사이트와 실전 가이드.",
    images: ["/twitter-image"],
  },
};

const blogJsonLd = {
  "@context": "https://schema.org",
  "@type": "Blog",
  name: "ArchFlow Tech Blog",
  description:
    "AWS architecture and cloud engineering insights, tutorials, and best practices.",
  url: `${SITE_URL}/blog`,
  inLanguage: ["ko", "en"],
  publisher: {
    "@type": "Organization",
    name: "ArchFlow",
    url: SITE_URL,
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />
      {children}
    </>
  );
}

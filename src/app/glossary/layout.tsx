import type { Metadata } from "next";

const SITE_URL = "https://archflow-aws.online";

export const metadata: Metadata = {
  title: "AWS 용어사전 | AWS Glossary",
  description:
    "AWS 서비스와 인프라 용어를 쉬운 비유와 함께 학습하세요. Learn AWS services and infrastructure terms with easy analogies.",
  openGraph: {
    title: "AWS 용어사전 — ArchFlow",
    description:
      "VPC, ECS, IAM 등 AWS 핵심 용어를 도시 비유로 쉽게 이해하세요. Learn AWS terms with city analogies.",
    url: `${SITE_URL}/glossary`,
    siteName: "ArchFlow",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "ArchFlow AWS Glossary" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AWS 용어사전 — ArchFlow",
    description:
      "VPC, ECS, IAM 등 AWS 핵심 용어를 도시 비유로 쉽게 이해하세요.",
    images: ["/twitter-image"],
  },
};

const glossaryJsonLd = {
  "@context": "https://schema.org",
  "@type": "DefinedTermSet",
  name: "AWS Glossary",
  description:
    "AWS services and infrastructure glossary with easy analogies — VPC, Subnet, ECS, EKS, IAM, and more.",
  url: `${SITE_URL}/glossary`,
  inLanguage: ["ko", "en"],
  hasDefinedTerm: [
    { "@type": "DefinedTerm", name: "VPC", description: "Virtual Private Cloud — isolated network environment in AWS" },
    { "@type": "DefinedTerm", name: "Subnet", description: "Subdivision of a VPC network range" },
    { "@type": "DefinedTerm", name: "Security Group", description: "Virtual firewall controlling inbound/outbound traffic" },
    { "@type": "DefinedTerm", name: "IAM", description: "Identity and Access Management for AWS resources" },
    { "@type": "DefinedTerm", name: "ECS", description: "Elastic Container Service — managed Docker orchestration" },
    { "@type": "DefinedTerm", name: "EKS", description: "Elastic Kubernetes Service — managed Kubernetes" },
    { "@type": "DefinedTerm", name: "ALB", description: "Application Load Balancer — Layer 7 traffic distribution" },
    { "@type": "DefinedTerm", name: "Route 53", description: "AWS DNS and domain management service" },
    { "@type": "DefinedTerm", name: "CloudFront", description: "Content Delivery Network (CDN) service" },
    { "@type": "DefinedTerm", name: "RDS", description: "Relational Database Service — managed SQL databases" },
  ],
};

export default function GlossaryLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(glossaryJsonLd) }}
      />
      {children}
    </>
  );
}

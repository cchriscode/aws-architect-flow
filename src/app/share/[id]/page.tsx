import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SharePageClient } from "./share-page-client";

const SITE_URL = "https://archflow-aws.online";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const share = await prisma.share.findUnique({ where: { shortId: id } });

  if (!share || share.expiresAt < new Date()) {
    return { title: "Not Found" };
  }

  const title = `${share.headline} | ArchFlow`;
  const description = `Monthly $${share.monthlyCost.toLocaleString()} · WAFR ${share.wafrScore}pts · ${share.serviceCount} services`;
  const ogImageUrl = `${SITE_URL}/api/og/${id}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/share/${id}`,
      siteName: "ArchFlow",
      type: "website",
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: share.headline }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function SharePage({ params }: Props) {
  const { id } = await params;
  const share = await prisma.share.findUnique({ where: { shortId: id } });

  if (!share || share.expiresAt < new Date()) {
    notFound();
  }

  return (
    <SharePageClient
      state={share.state as Record<string, unknown>}
      headline={share.headline}
      monthlyCost={share.monthlyCost}
      wafrScore={share.wafrScore}
      serviceCount={share.serviceCount}
    />
  );
}

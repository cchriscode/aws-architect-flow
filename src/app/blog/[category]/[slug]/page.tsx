import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { LANG_COOKIE } from "@/lib/i18n/context";
import { BlogPostPageClient } from "./blog-post-page-client";

const SITE_URL = "https://archflow-aws.online";

interface Props {
  params: Promise<{ category: string; slug: string }>;
}

function toDbSlug(category: string, slug: string) {
  return category !== "etc" ? `${category}-${slug}` : slug;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, slug } = await params;
  const dbSlug = toDbSlug(category, slug);

  const cookieStore = await cookies();
  const locale = cookieStore.get(LANG_COOKIE)?.value === "en" ? "en" : "ko";

  const post = await prisma.blogPost.findFirst({
    where: { slug: dbSlug, published: true, locale },
    select: { title: true, excerpt: true, thumbnailUrl: true, tags: true },
  });

  if (!post) return { title: "Post not found" };

  return {
    title: post.title,
    description: post.excerpt,
    keywords: post.tags,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `${SITE_URL}/blog/${category}/${slug}`,
      type: "article",
      ...(post.thumbnailUrl ? { images: [{ url: post.thumbnailUrl }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      ...(post.thumbnailUrl ? { images: [post.thumbnailUrl] } : {}),
    },
    alternates: {
      canonical: `${SITE_URL}/blog/${category}/${slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { category, slug } = await params;
  return <BlogPostPageClient category={category} slug={slug} />;
}

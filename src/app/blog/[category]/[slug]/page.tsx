import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BlogPostShell } from "./blog-post-shell";

const SITE_URL = "https://archflow-aws.online";

interface Params {
  category: string;
  slug: string;
}

async function getPost(categorySlug: string, slug: string) {
  const category = await prisma.blogCategory.findUnique({
    where: { slug: categorySlug },
  });
  if (!category) return null;

  const post = await prisma.blogPost.findFirst({
    where: { slug, categoryId: category.id, published: true },
    include: {
      author: { select: { name: true, image: true } },
      category: { select: { id: true, name: true, slug: true } },
    },
  });
  return post;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { category, slug } = await params;
  const post = await getPost(category, slug);
  if (!post) return { title: "Post not found" };

  const title = post.title;
  const description = post.excerpt || `${post.title} — DevOps 강의`;
  const url = `${SITE_URL}/blog/${category}/${slug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "ArchFlow",
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      authors: post.author.name ? [post.author.name] : undefined,
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: url,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { category, slug } = await params;
  const post = await getPost(category, slug);
  if (!post) notFound();

  // Increment views (fire and forget)
  prisma.blogPost
    .update({ where: { id: post.id }, data: { views: { increment: 1 } } })
    .catch(() => {});

  // Fetch related posts
  const relatedPosts =
    post.tags.length > 0
      ? await prisma.blogPost.findMany({
          where: {
            published: true,
            tags: { hasSome: post.tags },
            id: { not: post.id },
          },
          take: 3,
          orderBy: { publishedAt: "desc" },
          select: {
            slug: true,
            title: true,
            excerpt: true,
            thumbnailUrl: true,
            tags: true,
            category: { select: { id: true, name: true, slug: true } },
            publishedAt: true,
            readingTime: true,
            views: true,
            author: { select: { name: true, image: true } },
          },
        })
      : [];

  // JSON-LD for the article
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    url: `${SITE_URL}/blog/${category}/${slug}`,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: {
      "@type": "Person",
      name: post.author.name || "ArchFlow",
    },
    publisher: {
      "@type": "Organization",
      name: "ArchFlow",
      url: SITE_URL,
    },
    wordCount: post.content.length,
    timeRequired: `PT${post.readingTime}M`,
  };

  // Serialize dates for client component
  const serializedPost = {
    ...post,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  };

  const serializedRelated = relatedPosts.map((p) => ({
    ...p,
    publishedAt: p.publishedAt?.toISOString() ?? null,
  }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogPostShell post={serializedPost} relatedPosts={serializedRelated} />
    </>
  );
}

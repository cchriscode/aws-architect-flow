import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

function computeReadingTime(markdown: string): number {
  const words = markdown.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const posts = await prisma.blogPost.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        content: true,
        excerpt: true,
        thumbnailUrl: true,
        categoryId: true,
        series: true,
        published: true,
        publishedAt: true,
        views: true,
        tags: true,
        locale: true,
        createdAt: true,
      },
    });

    return NextResponse.json(posts);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    title,
    slug,
    content,
    excerpt,
    thumbnailUrl,
    tags,
    categoryId,
    series,
    seriesOrder,
    published,
  } = body as {
    title?: string;
    slug?: string;
    content?: string;
    excerpt?: string;
    thumbnailUrl?: string;
    tags?: string[];
    categoryId?: string;
    series?: string;
    seriesOrder?: number;
    published?: boolean;
  };

  if (!title || !content) {
    return NextResponse.json(
      { error: "title and content are required" },
      { status: 400 },
    );
  }

  const finalSlug = slug || generateSlug(title);
  const readingTime = computeReadingTime(content);

  const post = await prisma.blogPost.create({
    data: {
      title,
      slug: finalSlug,
      content,
      excerpt: excerpt ?? "",
      thumbnailUrl: thumbnailUrl || null,
      tags: tags ?? [],
      categoryId: categoryId || null,
      series: series || null,
      seriesOrder: seriesOrder ?? null,
      published: published ?? false,
      publishedAt: published ? new Date() : null,
      readingTime,
      authorId: session.user.id,
    },
  });

  return NextResponse.json(post, { status: 201 });
}

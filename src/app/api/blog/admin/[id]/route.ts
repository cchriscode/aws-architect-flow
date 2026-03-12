import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

function computeReadingTime(markdown: string): number {
  const words = markdown.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const existing = await prisma.blogPost.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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
    categoryId?: string | null;
    series?: string;
    seriesOrder?: number;
    published?: boolean;
  };

  const readingTime = content ? computeReadingTime(content) : undefined;

  // Set publishedAt when publishing for the first time
  let publishedAt = existing.publishedAt;
  if (published && !existing.publishedAt) {
    publishedAt = new Date();
  } else if (published === false) {
    publishedAt = null;
  }

  const post = await prisma.blogPost.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(slug !== undefined && { slug }),
      ...(content !== undefined && { content }),
      ...(excerpt !== undefined && { excerpt }),
      ...(thumbnailUrl !== undefined && { thumbnailUrl: thumbnailUrl || null }),
      ...(tags !== undefined && { tags }),
      ...(categoryId !== undefined && { categoryId: categoryId || null }),
      ...(series !== undefined && { series: series || null }),
      ...(seriesOrder !== undefined && { seriesOrder }),
      ...(published !== undefined && { published }),
      ...(publishedAt !== undefined && { publishedAt }),
      ...(readingTime !== undefined && { readingTime }),
    },
  });

  return NextResponse.json(post);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  await prisma.blogPost.delete({ where: { id } }).catch(() => null);

  return NextResponse.json({ ok: true });
}

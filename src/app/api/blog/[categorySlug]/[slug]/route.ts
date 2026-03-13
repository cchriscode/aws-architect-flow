import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ categorySlug: string; slug: string }> },
) {
  try {
    const { categorySlug, slug } = await params;

    // Find category by slug
    const category = await prisma.blogCategory.findUnique({
      where: { slug: categorySlug },
    });

    if (!category) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const post = await prisma.blogPost.findFirst({
      where: { slug, categoryId: category.id, published: true },
      include: {
        author: { select: { name: true, image: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Increment views (fire and forget)
    prisma.blogPost
      .update({ where: { id: post.id }, data: { views: { increment: 1 } } })
      .catch(() => {});

    return NextResponse.json(post);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

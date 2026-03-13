import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const locale = _req.cookies.get("archflow_lang")?.value === "en" ? "en" : "ko";
    const categorySlug = _req.nextUrl.searchParams.get("category");

    const where: Record<string, unknown> = { slug, published: true, locale };
    if (categorySlug && categorySlug !== "etc") {
      where.category = { slug: categorySlug };
    }

    const post = await prisma.blogPost.findFirst({
      where,
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

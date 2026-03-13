import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const tag = searchParams.get("tag");
    const categoryId = searchParams.get("categoryId");
    const sort = searchParams.get("sort") ?? "latest";
    const cursor = searchParams.get("cursor");
    const limit = 12;

    const locale = req.cookies.get("archflow_lang")?.value === "en" ? "en" : "ko";
    const where: Record<string, unknown> = { published: true, locale };
    if (tag) where.tags = { has: tag };
    if (categoryId) where.categoryId = categoryId;

    const orderBy =
      sort === "popular"
        ? { views: "desc" as const }
        : sort === "oldest"
          ? { publishedAt: "asc" as const }
          : sort === "name-asc"
            ? { title: "asc" as const }
            : sort === "name-desc"
              ? { title: "desc" as const }
              : { publishedAt: "desc" as const };

    const posts = await prisma.blogPost.findMany({
      where,
      orderBy,
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        thumbnailUrl: true,
        tags: true,
        categoryId: true,
        category: { select: { id: true, name: true, slug: true } },
        publishedAt: true,
        readingTime: true,
        views: true,
        author: { select: { name: true, image: true } },
      },
    });

    const hasMore = posts.length > limit;
    if (hasMore) posts.pop();

    return NextResponse.json({
      posts,
      nextCursor: hasMore ? posts[posts.length - 1].id : null,
    });
  } catch {
    return NextResponse.json({ posts: [], nextCursor: null });
  }
}

"use client";

import { useState, useCallback, useEffect } from "react";
import { useDict } from "@/lib/i18n/context";
import { PostCard } from "@/components/blog/PostCard";
import { TagPill } from "@/components/blog/TagPill";

interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  thumbnailUrl?: string | null;
  tags: string[];
  category?: { id: string; name: string; slug: string } | null;
  publishedAt: string | null;
  readingTime: number;
  views: number;
  author?: { name?: string | null; image?: string | null } | null;
}

interface BlogListClientProps {
  initialPosts: Post[];
  initialNextCursor: string | null;
  allTags: string[];
  initialTag?: string;
  activeCategoryId?: string;
}

export function BlogListClient({
  initialPosts,
  initialNextCursor,
  allTags,
  initialTag,
  activeCategoryId,
}: BlogListClientProps) {
  const t = useDict();
  const [posts, setPosts] = useState(initialPosts);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [activeTag, setActiveTag] = useState(initialTag ?? "");
  const [sort, setSort] = useState<"latest" | "oldest" | "popular">("latest");
  const [loading, setLoading] = useState(false);

  // Sync when parent changes posts via category switch
  useEffect(() => {
    setPosts(initialPosts);
    setNextCursor(initialNextCursor);
  }, [initialPosts, initialNextCursor]);

  const fetchPosts = useCallback(
    async (opts: { tag?: string; categoryId?: string; sortBy?: string; cursor?: string }) => {
      try {
        const params = new URLSearchParams();
        if (opts.tag) params.set("tag", opts.tag);
        if (opts.categoryId) params.set("categoryId", opts.categoryId);
        params.set("sort", opts.sortBy ?? "latest");
        if (opts.cursor) params.set("cursor", opts.cursor);
        const res = await fetch(`/api/blog?${params}`);
        if (!res.ok) return { posts: [], nextCursor: null };
        return await res.json();
      } catch {
        return { posts: [], nextCursor: null };
      }
    },
    [],
  );

  const handleTagChange = async (tag: string) => {
    const newTag = tag === activeTag ? "" : tag;
    setActiveTag(newTag);
    setLoading(true);
    const data = await fetchPosts({ tag: newTag, categoryId: activeCategoryId, sortBy: sort });
    setPosts(data.posts);
    setNextCursor(data.nextCursor);
    setLoading(false);
  };

  const handleSortChange = async (newSort: "latest" | "oldest" | "popular") => {
    setSort(newSort);
    setLoading(true);
    const data = await fetchPosts({ tag: activeTag, categoryId: activeCategoryId, sortBy: newSort });
    setPosts(data.posts);
    setNextCursor(data.nextCursor);
    setLoading(false);
  };

  const loadMore = async () => {
    if (!nextCursor) return;
    setLoading(true);
    const data = await fetchPosts({
      tag: activeTag,
      categoryId: activeCategoryId,
      sortBy: sort,
      cursor: nextCursor,
    });
    setPosts((prev) => [...prev, ...data.posts]);
    setNextCursor(data.nextCursor);
    setLoading(false);
  };

  return (
    <>
      {/* Title */}
      <h1 className="text-xl font-bold text-gray-900">{t.blog.title}</h1>
      <p className="mt-1 text-sm text-gray-500">{t.blog.subtitle}</p>

      {/* Tag filter + Sort row */}
      <div className="mt-4 flex items-center justify-between gap-3">
        {allTags.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            <TagPill
              tag={t.blog.allTags}
              active={activeTag === ""}
              onClick={() => handleTagChange("")}
            />
            {allTags.map((tag) => (
              <TagPill
                key={tag}
                tag={tag}
                active={activeTag === tag}
                onClick={() => handleTagChange(tag)}
              />
            ))}
          </div>
        )}
        <div className="flex shrink-0 gap-1.5">
          <button
            onClick={() => handleSortChange(sort === "latest" ? "oldest" : "latest")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              sort === "latest" || sort === "oldest"
                ? "bg-indigo-600 text-white"
                : "border-[1.5px] border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {sort === "oldest" ? t.blog.sortOldest : t.blog.sortLatest}
          </button>
          <button
            onClick={() => handleSortChange("popular")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              sort === "popular"
                ? "bg-indigo-600 text-white"
                : "border-[1.5px] border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {t.blog.sortPopular}
          </button>
        </div>
      </div>

      {/* Grid */}
      {posts.length > 0 ? (
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              {...post}
              categorySlug={post.category?.slug}
              readingTimeLabel={t.blog.readingTime}
              viewsLabel={t.blog.views}
            />
          ))}
        </div>
      ) : (
        <div className="mt-10 flex flex-col items-center rounded-xl border-[1.5px] border-dashed border-gray-300 py-12">
          <p className="text-sm font-bold text-gray-500">{t.blog.emptyTitle}</p>
          <p className="mt-1 text-xs text-gray-400">{t.blog.emptyDesc}</p>
        </div>
      )}

      {/* Load more */}
      {nextCursor && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="rounded-lg border-[1.5px] border-gray-200 bg-white px-6 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? "..." : t.blog.loadMore}
          </button>
        </div>
      )}
    </>
  );
}

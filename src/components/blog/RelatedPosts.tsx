"use client";

import { PostCard } from "./PostCard";

interface RelatedPost {
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

interface RelatedPostsProps {
  posts: RelatedPost[];
  label: string;
  readingTimeLabel: (min: number) => string;
  viewsLabel: (n: number) => string;
}

export function RelatedPosts({
  posts,
  label,
  readingTimeLabel,
  viewsLabel,
}: RelatedPostsProps) {
  if (posts.length === 0) return null;

  return (
    <section>
      <h2 className="mb-4 text-sm font-bold text-gray-900">{label}</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {posts.map((post) => (
          <PostCard
            key={post.slug}
            {...post}
            categorySlug={post.category?.slug}
            readingTimeLabel={readingTimeLabel}
            viewsLabel={viewsLabel}
          />
        ))}
      </div>
    </section>
  );
}

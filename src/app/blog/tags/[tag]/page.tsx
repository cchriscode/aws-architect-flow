"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useDict } from "@/lib/i18n/context";
import { Header } from "@/components/layout/Header";
import { LoginModal } from "@/components/auth/LoginModal";
import { BlogListClient } from "../../blog-list-client";

export default function BlogTagPage() {
  const params = useParams();
  const tag = decodeURIComponent(params.tag as string);
  const t = useDict();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [data, setData] = useState<{
    posts: Array<{
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
    }>;
    nextCursor: string | null;
    allTags: string[];
  } | null>(null);

  useEffect(() => {
    fetch(`/api/blog?tag=${encodeURIComponent(tag)}`)
      .then((r) => (r.ok ? r.json() : { posts: [], nextCursor: null }))
      .then((blogData) => {
        const allTags = Array.from(
          new Set(blogData.posts.flatMap((p: { tags: string[] }) => p.tags)),
        ) as string[];
        setData({ posts: blogData.posts, nextCursor: blogData.nextCursor, allTags });
      })
      .catch(() => {
        setData({ posts: [], nextCursor: null, allTags: [] });
      });
  }, [tag]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onLoginClick={() => setShowLoginModal(true)} />
      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}

      <div className="mx-auto max-w-[900px] px-7 py-6">
        <h1 className="mb-4 text-lg font-bold text-gray-900">
          {t.blog.tagPageTitle(tag)}
        </h1>
        {data ? (
          <BlogListClient
            initialPosts={data.posts}
            initialNextCursor={data.nextCursor}
            allTags={data.allTags}
            initialTag={tag}
          />
        ) : (
          <div className="flex justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          </div>
        )}
      </div>
    </div>
  );
}

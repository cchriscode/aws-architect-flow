"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { LoginModal } from "@/components/auth/LoginModal";
import { useLang } from "@/lib/i18n/context";
import { BlogPostClient } from "./blog-post-client";

interface Props {
  category: string;
  slug: string;
}

export function BlogPostPageClient({ category, slug }: Props) {
  const { lang } = useLang();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [post, setPost] = useState<any>(null);
  const [relatedPosts, setRelatedPosts] = useState<any[]>([]);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setNotFound(false);
    setPost(null);
    const dbSlug = category !== "etc" ? `${category}-${slug}` : slug;
    fetch(`/api/blog/${dbSlug}`)
      .then((r) => {
        if (!r.ok) { setNotFound(true); return null; }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        setPost(data);

        if (data.tags?.length > 0) {
          fetch(`/api/blog?tag=${encodeURIComponent(data.tags[0])}`)
            .then((r) => r.ok ? r.json() : { posts: [] })
            .then((d) => {
              setRelatedPosts(
                (d.posts || []).filter((p: any) => p.slug !== data.slug).slice(0, 3)
              );
            })
            .catch(() => {});
        }
      })
      .catch(() => setNotFound(true));
  }, [category, slug, lang]);

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onLoginClick={() => setShowLoginModal(true)} />
        {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
        <div className="flex justify-center py-20 text-gray-500">Post not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onLoginClick={() => setShowLoginModal(true)} />
      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
      {post ? (
        <BlogPostClient post={post} relatedPosts={relatedPosts} />
      ) : (
        <div className="flex justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { LoginModal } from "@/components/auth/LoginModal";
import { BlogPostClient } from "./blog-post-client";

interface Author {
  name?: string | null;
  image?: string | null;
}

interface Post {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  tags: string[];
  category?: { id: string; name: string; slug: string } | null;
  publishedAt: string | null;
  readingTime: number;
  views: number;
  author: Author;
}

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
  author?: Author | null;
}

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [post, setPost] = useState<Post | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([]);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/blog/${slug}`)
      .then((r) => {
        if (!r.ok) {
          setNotFound(true);
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        setPost(data);

        // Fetch related posts by tag
        if (data.tags?.length > 0) {
          fetch(`/api/blog?tag=${encodeURIComponent(data.tags[0])}`)
            .then((r) => r.json())
            .then((d) => {
              setRelatedPosts(
                d.posts
                  .filter((p: { slug: string }) => p.slug !== slug)
                  .slice(0, 3),
              );
            });
        }
      });
  }, [slug]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onLoginClick={() => setShowLoginModal(true)} />
      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}

      {notFound ? (
        <div className="flex flex-col items-center py-20">
          <p className="text-sm font-bold text-gray-500">Post not found</p>
        </div>
      ) : post ? (
        <BlogPostClient post={post} relatedPosts={relatedPosts} />
      ) : (
        <div className="flex justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      )}
    </div>
  );
}

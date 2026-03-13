"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { LoginModal } from "@/components/auth/LoginModal";
import { BlogPostClient } from "./blog-post-client";

interface Author {
  name?: string | null;
  image?: string | null;
}

interface Post {
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

export function BlogPostShell({
  post,
  relatedPosts,
}: {
  post: Post;
  relatedPosts: RelatedPost[];
}) {
  const [showLoginModal, setShowLoginModal] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onLoginClick={() => setShowLoginModal(true)} />
      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
      <BlogPostClient post={post} relatedPosts={relatedPosts} />
    </div>
  );
}

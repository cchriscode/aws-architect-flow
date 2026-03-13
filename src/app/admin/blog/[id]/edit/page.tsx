"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDict } from "@/lib/i18n/context";
import { AdminPostForm } from "@/components/blog/AdminPostForm";
import { Header } from "@/components/layout/Header";
import { LoginModal } from "@/components/auth/LoginModal";

interface PostData {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  thumbnailUrl: string | null;
  tags: string[];
  categoryId: string | null;
  series: string | null;
  published: boolean;
}

export default function AdminEditPostPage() {
  const t = useDict();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [post, setPost] = useState<PostData | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    fetch(`/api/blog/admin`)
      .then((r) => r.json())
      .then((posts: PostData[]) => {
        const found = posts.find((p) => p.id === id);
        if (found) {
          setPost(found);
        }
      });
  }, [id]);

  const handleSubmit = async (data: {
    title: string;
    slug: string;
    excerpt: string;
    thumbnailUrl: string;
    tags: string[];
    categoryId: string;
    series: string;
    content: string;
    published: boolean;
  }) => {
    const res = await fetch(`/api/blog/admin/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      router.push("/admin/blog");
    }
  };

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onLoginClick={() => setShowLoginModal(true)} />
        {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
        <div className="flex justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onLoginClick={() => setShowLoginModal(true)} />
      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}

      <div className="mx-auto max-w-[900px] px-7 py-6">
        <h1 className="mb-6 text-xl font-bold text-gray-900">
          {t.blog.admin.editPost}
        </h1>
        <AdminPostForm
          initialData={{
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt ?? "",
            thumbnailUrl: post.thumbnailUrl ?? "",
            tags: post.tags.join(", "),
            categoryId: post.categoryId ?? "",
            series: post.series ?? "",
            content: post.content ?? "",
            published: post.published,
          }}
          labels={t.blog.admin}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}

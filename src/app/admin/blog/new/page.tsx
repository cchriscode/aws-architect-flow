"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDict } from "@/lib/i18n/context";
import { AdminPostForm } from "@/components/blog/AdminPostForm";
import { Header } from "@/components/layout/Header";
import { LoginModal } from "@/components/auth/LoginModal";

export default function AdminNewPostPage() {
  const t = useDict();
  const router = useRouter();
  const [showLoginModal, setShowLoginModal] = useState(false);

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
    const res = await fetch("/api/blog/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      router.push("/admin/blog");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onLoginClick={() => setShowLoginModal(true)} />
      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}

      <div className="mx-auto max-w-[900px] px-7 py-6">
        <h1 className="mb-6 text-xl font-bold text-gray-900">
          {t.blog.admin.newPost}
        </h1>
        <AdminPostForm labels={t.blog.admin} onSubmit={handleSubmit} />
      </div>
    </div>
  );
}

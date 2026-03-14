"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { LoginModal } from "@/components/auth/LoginModal";
import { useDict, useLang } from "@/lib/i18n/context";
import { BlogListClient } from "./blog-list-client";
import { Pencil, FolderOpen } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  _count?: { posts: number };
}

interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  thumbnailUrl?: string | null;
  tags: string[];
  categoryId?: string | null;
  category?: { id: string; name: string; slug: string } | null;
  publishedAt: string | null;
  readingTime: number;
  views: number;
  author?: { name?: string | null; image?: string | null } | null;
}

export default function BlogPage() {
  const t = useDict();
  const { lang } = useLang();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState("");
  const [data, setData] = useState<{
    posts: Post[];
    nextCursor: string | null;
    allTags: string[];
    categories: Category[];
  } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/blog/categories").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/blog/admin/check").then((r) => r.json()).catch(() => ({ admin: false })),
    ]).then(async ([categories, adminData]) => {
      setIsAdmin(adminData.admin === true);
      const firstCatId = categories.length > 0 ? categories[0].id : "";
      setActiveCategoryId(firstCatId);
      const params = new URLSearchParams();
      if (firstCatId) params.set("categoryId", firstCatId);
      params.set("sort", "name-asc");
      const res = await fetch(`/api/blog?${params}`);
      const blogData = res.ok ? await res.json() : { posts: [], nextCursor: null };
      const allTags = Array.from(
        new Set(blogData.posts.flatMap((p: Post) => p.tags)),
      ) as string[];
      setData({
        posts: blogData.posts,
        nextCursor: blogData.nextCursor,
        allTags,
        categories,
      });
    });
  }, [lang]);

  const handleCategoryChange = async (catId: string) => {
    setActiveCategoryId(catId);
    try {
      const params = new URLSearchParams();
      if (catId) params.set("categoryId", catId);
      params.set("sort", "name-asc");
      const res = await fetch(`/api/blog?${params}`);
      if (res.ok) {
        const blogData = await res.json();
        const allTags = Array.from(
          new Set(blogData.posts.flatMap((p: Post) => p.tags)),
        ) as string[];
        setData((prev) =>
          prev
            ? { ...prev, posts: blogData.posts, nextCursor: blogData.nextCursor, allTags }
            : prev,
        );
      }
    } catch {}
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onLoginClick={() => setShowLoginModal(true)} />
      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}

      <div className="mx-auto flex max-w-[1100px] gap-6 px-7 py-6">
        {/* Left sidebar — categories */}
        {data && (
          <aside className="hidden w-48 shrink-0 md:block">
            <div className="sticky top-20">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-gray-500">
                <FolderOpen className="h-3.5 w-3.5" />
                {t.blog.categoryLabel}
              </p>
              <nav className="space-y-0.5">
                {data.categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryChange(cat.id)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors ${
                      activeCategoryId === cat.id
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {cat.name}
                    {cat._count && cat._count.posts > 0 && (
                      <span className="text-[10px] text-gray-400">
                        {cat._count.posts}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </aside>
        )}

        {/* Main content */}
        <div className="min-w-0 flex-1">
          {isAdmin && (
            <div className="mb-4 flex justify-end">
              <Link
                href="/admin/blog"
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-indigo-700"
              >
                <Pencil className="h-3.5 w-3.5" />
                글 관리
              </Link>
            </div>
          )}

          {/* Mobile category select */}
          {data && data.categories.length > 0 && (
            <div className="mb-4 md:hidden">
              <select
                value={activeCategoryId}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full rounded-lg border-[1.5px] border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400"
              >
                {data.categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} {cat._count ? `(${cat._count.posts})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {data ? (
            <BlogListClient
              initialPosts={data.posts}
              initialNextCursor={data.nextCursor}
              allTags={data.allTags}
              activeCategoryId={activeCategoryId}
            />
          ) : (
            <div className="flex justify-center py-20">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

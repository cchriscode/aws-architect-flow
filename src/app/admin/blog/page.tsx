"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDict } from "@/lib/i18n/context";
import { Trash2, Pencil, Plus, ChevronUp, ChevronDown } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { LoginModal } from "@/components/auth/LoginModal";

interface Post {
  id: string;
  slug: string;
  title: string;
  published: boolean;
  publishedAt: string | null;
  views: number;
  tags: string[];
  createdAt: string;
  categoryId: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  _count?: { posts: number };
}

export default function AdminBlogPage() {
  const t = useDict();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/blog/admin").then((r) => r.json()).catch(() => []),
      fetch("/api/blog/categories").then((r) => r.json()).catch(() => []),
    ]).then(([postsData, catsData]) => {
      setPosts(postsData);
      setCategories(catsData);
      setLoading(false);
    });
  }, []);

  const totalPosts = posts.length;
  const publishedPosts = posts.filter((p) => p.published).length;
  const draftPosts = posts.filter((p) => !p.published).length;
  const totalViews = posts.reduce((sum, p) => sum + p.views, 0);

  const filteredPosts =
    activeTab === null
      ? posts
      : activeTab === "uncategorized"
        ? posts.filter((p) => !p.categoryId)
        : posts.filter((p) => p.categoryId === activeTab);

  const togglePublish = async (post: Post) => {
    await fetch(`/api/blog/admin/${post.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !post.published }),
    });
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id ? { ...p, published: !p.published } : p,
      ),
    );
  };

  const deletePost = async (post: Post) => {
    if (!confirm(t.blog.admin.deleteConfirm)) return;
    await fetch(`/api/blog/admin/${post.id}`, { method: "DELETE" });
    setPosts((prev) => prev.filter((p) => p.id !== post.id));
  };

  const addCategory = async () => {
    if (!newCategoryName.trim()) return;
    setAddingCategory(true);
    const res = await fetch("/api/blog/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategoryName.trim() }),
    });
    if (res.ok) {
      const cat = await res.json();
      setCategories((prev) => [...prev, cat]);
      setNewCategoryName("");
    }
    setAddingCategory(false);
  };

  const deleteCategory = async (cat: Category) => {
    if (!confirm(t.blog.admin.deleteCategoryConfirm)) return;
    await fetch(`/api/blog/categories/${cat.id}`, { method: "DELETE" });
    setCategories((prev) => prev.filter((c) => c.id !== cat.id));
    if (activeTab === cat.id) setActiveTab(null);
  };

  const moveCategoryOrder = async (index: number, direction: "up" | "down") => {
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= categories.length) return;

    const sorted = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);
    const current = sorted[index];
    const target = sorted[swapIndex];

    const newCategories = categories.map((c) => {
      if (c.id === current.id) return { ...c, sortOrder: target.sortOrder };
      if (c.id === target.id) return { ...c, sortOrder: current.sortOrder };
      return c;
    });
    setCategories(newCategories);

    await Promise.all([
      fetch(`/api/blog/categories/${current.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: target.sortOrder }),
      }),
      fetch(`/api/blog/categories/${target.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: current.sortOrder }),
      }),
    ]);
  };

  const sortedCategories = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onLoginClick={() => setShowLoginModal(true)} />
      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}

      <div className="mx-auto max-w-[900px] px-7 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">
            {t.blog.admin.title}
          </h1>
          <Link
            href="/admin/blog/new"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-indigo-700"
          >
            {t.blog.admin.newPost}
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="mt-6 grid grid-cols-4 gap-3">
              {[
                { label: t.blog.admin.totalPosts, value: totalPosts, color: "text-gray-900" },
                { label: t.blog.admin.publishedPosts, value: publishedPosts, color: "text-green-600" },
                { label: t.blog.admin.draftPosts, value: draftPosts, color: "text-gray-500" },
                { label: t.blog.admin.totalViews, value: totalViews.toLocaleString(), color: "text-indigo-600" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border-[1.5px] border-gray-200 bg-white px-4 py-3"
                >
                  <p className="text-[11px] font-medium text-gray-400">
                    {stat.label}
                  </p>
                  <p className={`mt-1 text-lg font-bold ${stat.color}`}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Category Management */}
            <section className="mt-6">
              <h2 className="text-sm font-bold text-gray-700">
                {t.blog.admin.categoriesTitle}
              </h2>

              {/* Add category */}
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCategory())}
                  placeholder={t.blog.admin.categoryName}
                  className="flex-1 rounded-lg border-[1.5px] border-gray-200 bg-white px-3 py-1.5 text-sm outline-none transition-colors focus:border-indigo-400"
                />
                <button
                  onClick={addCategory}
                  disabled={addingCategory || !newCategoryName.trim()}
                  className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {t.blog.admin.addCategory}
                </button>
              </div>

              {/* Category list */}
              {categories.length === 0 ? (
                <p className="mt-3 text-xs text-gray-400">
                  {t.blog.admin.noCategoriesDesc}
                </p>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  {sortedCategories.map((cat, idx) => (
                    <div
                      key={cat.id}
                      className="flex items-center gap-1.5 rounded-lg border-[1.5px] border-gray-200 bg-white px-3 py-1.5"
                    >
                      <span className="text-xs font-medium text-gray-700">
                        {cat.name}
                      </span>
                      {cat._count && (
                        <span className="text-[10px] text-gray-400">
                          ({cat._count.posts})
                        </span>
                      )}
                      <button
                        onClick={() => moveCategoryOrder(idx, "up")}
                        disabled={idx === 0}
                        className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30"
                        title={t.blog.admin.moveUp}
                      >
                        <ChevronUp className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => moveCategoryOrder(idx, "down")}
                        disabled={idx === sortedCategories.length - 1}
                        className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30"
                        title={t.blog.admin.moveDown}
                      >
                        <ChevronDown className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => deleteCategory(cat)}
                        className="ml-0.5 rounded p-0.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Divider */}
            <hr className="my-6 border-gray-200" />

            {/* Category Tab Bar */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setActiveTab(null)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeTab === null
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {t.blog.admin.allTab} ({posts.length})
              </button>
              {sortedCategories.map((cat) => {
                const count = posts.filter((p) => p.categoryId === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveTab(cat.id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      activeTab === cat.id
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {cat.name} ({count})
                  </button>
                );
              })}
              <button
                onClick={() => setActiveTab("uncategorized")}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeTab === "uncategorized"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                미분류 ({posts.filter((p) => !p.categoryId).length})
              </button>
            </div>

            {/* Posts list */}
            {filteredPosts.length === 0 ? (
              <div className="mt-4 flex flex-col items-center rounded-xl border-[1.5px] border-dashed border-gray-300 py-12">
                <p className="text-sm font-bold text-gray-500">
                  {t.blog.admin.noPostsTitle}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {t.blog.admin.noPostsDesc}
                </p>
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                {filteredPosts.map((post) => (
                  <div
                    key={post.id}
                    className="flex items-center justify-between rounded-xl border-[1.5px] border-gray-200 bg-white px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-bold text-gray-900">
                          {post.title}
                        </span>
                        <span
                          className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                            post.published
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {post.published
                            ? t.blog.admin.published
                            : t.blog.admin.draft}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-gray-400">
                        <span>{post.slug}</span>
                        <span>·</span>
                        <span>
                          {new Date(post.createdAt).toLocaleDateString("ko-KR")}
                        </span>
                        <span>·</span>
                        <span>{post.views} views</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        onClick={() => togglePublish(post)}
                        className={`rounded-md px-2 py-1 text-[10px] font-medium ${
                          post.published
                            ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            : "bg-green-100 text-green-700 hover:bg-green-200"
                        }`}
                      >
                        {post.published
                          ? t.blog.admin.unpublish
                          : t.blog.admin.publish}
                      </button>
                      <button
                        onClick={() =>
                          router.push(`/admin/blog/${post.id}/edit`)
                        }
                        className="rounded-md bg-gray-100 p-1.5 text-gray-500 hover:bg-gray-200"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => deletePost(post)}
                        className="rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

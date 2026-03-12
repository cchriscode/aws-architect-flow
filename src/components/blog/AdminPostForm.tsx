"use client";

import { useState, useEffect } from "react";
import { PostContent } from "./PostContent";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface AdminPostFormProps {
  initialData?: {
    title: string;
    slug: string;
    excerpt: string;
    thumbnailUrl: string;
    tags: string;
    categoryId: string;
    series: string;
    content: string;
    published: boolean;
  };
  labels: {
    titleLabel: string;
    slugLabel: string;
    excerptLabel: string;
    thumbnailLabel: string;
    tagsLabel: string;
    categoryLabel: string;
    categoryPlaceholder: string;
    seriesLabel: string;
    contentLabel: string;
    preview: string;
    edit: string;
    publishedCheckbox: string;
    save: string;
    saving: string;
  };
  onSubmit: (data: {
    title: string;
    slug: string;
    excerpt: string;
    thumbnailUrl: string;
    tags: string[];
    categoryId: string;
    series: string;
    content: string;
    published: boolean;
  }) => Promise<void>;
}

export function AdminPostForm({ initialData, labels, onSubmit }: AdminPostFormProps) {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [excerpt, setExcerpt] = useState(initialData?.excerpt ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState(initialData?.thumbnailUrl ?? "");
  const [tags, setTags] = useState(initialData?.tags ?? "");
  const [categoryId, setCategoryId] = useState(initialData?.categoryId ?? "");
  const [series, setSeries] = useState(initialData?.series ?? "");
  const [content, setContent] = useState(initialData?.content ?? "");
  const [published, setPublished] = useState(initialData?.published ?? false);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch("/api/blog/categories")
      .then((r) => (r.ok ? r.json() : []))
      .then(setCategories)
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit({
        title,
        slug,
        excerpt,
        thumbnailUrl,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        categoryId,
        series,
        content,
        published,
      });
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full rounded-lg border-[1.5px] border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-indigo-400";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">
          {labels.titleLabel}
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputCls}
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">
          {labels.slugLabel}
        </label>
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className={inputCls}
          placeholder="auto-generated-if-empty"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">
          {labels.excerptLabel}
        </label>
        <input
          type="text"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          className={inputCls}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            {labels.categoryLabel}
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={inputCls}
          >
            <option value="">{labels.categoryPlaceholder}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            {labels.seriesLabel}
          </label>
          <input
            type="text"
            value={series}
            onChange={(e) => setSeries(e.target.value)}
            className={inputCls}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            {labels.thumbnailLabel}
          </label>
          <input
            type="url"
            value={thumbnailUrl}
            onChange={(e) => setThumbnailUrl(e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            {labels.tagsLabel}
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className={inputCls}
            placeholder="aws, vpc, architecture"
          />
        </div>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="text-xs font-medium text-gray-700">
            {labels.contentLabel}
          </label>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="rounded-md bg-gray-100 px-2 py-1 text-[10px] font-medium text-gray-600 hover:bg-gray-200"
          >
            {showPreview ? labels.edit : labels.preview}
          </button>
        </div>
        {showPreview ? (
          <div className="min-h-[300px] rounded-lg border-[1.5px] border-gray-200 bg-white p-4">
            <PostContent content={content} />
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={`${inputCls} min-h-[300px] font-mono text-xs`}
            required
          />
        )}
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="rounded border-gray-300"
          />
          {labels.publishedCheckbox}
        </label>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? labels.saving : labels.save}
        </button>
      </div>
    </form>
  );
}

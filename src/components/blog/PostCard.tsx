"use client";

import Link from "next/link";
import { TagPill } from "./TagPill";
import { Clock, Eye } from "lucide-react";

interface PostCardProps {
  slug: string;
  title: string;
  excerpt: string;
  thumbnailUrl?: string | null;
  tags: string[];
  publishedAt: string | null;
  readingTime: number;
  views: number;
  author?: { name?: string | null; image?: string | null } | null;
  readingTimeLabel: (min: number) => string;
  viewsLabel: (n: number) => string;
}

export function PostCard({
  slug,
  title,
  excerpt,
  thumbnailUrl,
  tags,
  publishedAt,
  readingTime,
  views,
  readingTimeLabel,
  viewsLabel,
}: PostCardProps) {
  return (
    <Link
      href={`/blog/${slug}`}
      className="group block rounded-xl border-[1.5px] border-gray-200 bg-white transition-colors hover:border-indigo-300"
    >
      {thumbnailUrl && (
        <div className="relative h-40 w-full overflow-hidden rounded-t-xl">
          <img
            src={thumbnailUrl}
            alt={title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        </div>
      )}
      <div className="p-4">
        <h3 className="text-sm font-bold text-gray-900 line-clamp-2 group-hover:text-indigo-600">
          {title}
        </h3>
        <p className="mt-1.5 text-xs leading-relaxed text-gray-500 line-clamp-2">
          {excerpt}
        </p>
        {tags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
        <div className="mt-3 flex items-center gap-3 text-[11px] text-gray-400">
          {publishedAt && (
            <span>
              {new Date(publishedAt).toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
          <span className="flex items-center gap-0.5">
            <Clock className="h-3 w-3" />
            {readingTimeLabel(readingTime)}
          </span>
          <span className="flex items-center gap-0.5">
            <Eye className="h-3 w-3" />
            {viewsLabel(views)}
          </span>
        </div>
      </div>
    </Link>
  );
}

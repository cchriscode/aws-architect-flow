"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useDict } from "@/lib/i18n/context";
import { PostContent } from "@/components/blog/PostContent";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { ShareButtons } from "@/components/blog/ShareButtons";
import { RelatedPosts } from "@/components/blog/RelatedPosts";
import { TagPill } from "@/components/blog/TagPill";
import { Clock, Eye, ArrowUp } from "lucide-react";

interface Author {
  name?: string | null;
  image?: string | null;
}

interface Post {
  slug: string;
  title: string;
  content: string;
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

interface BlogPostClientProps {
  post: Post;
  relatedPosts: RelatedPost[];
}

export function BlogPostClient({ post, relatedPosts }: BlogPostClientProps) {
  const t = useDict();
  const url = typeof window !== "undefined" ? window.location.href : "";
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <article className="mx-auto max-w-[900px] px-7 py-6">
      {/* Back link */}
      <Link
        href="/blog"
        className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
      >
        {t.blog.backToBlog}
      </Link>

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <TagPill key={tag} tag={tag} href={`/blog/tags/${encodeURIComponent(tag)}`} />
          ))}
        </div>
      )}

      {/* Title */}
      <h1 className="mt-3 text-xl font-extrabold text-gray-900">{post.title}</h1>

      {/* Meta */}
      <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
        {post.author.image && (
          <img
            src={post.author.image}
            alt={post.author.name ?? ""}
            className="h-6 w-6 rounded-full"
          />
        )}
        {post.author.name && <span className="font-medium">{post.author.name}</span>}
        {post.publishedAt && (
          <span>
            {new Date(post.publishedAt).toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        )}
        <span className="flex items-center gap-0.5">
          <Clock className="h-3 w-3" />
          {t.blog.readingTime(post.readingTime)}
        </span>
        <span className="flex items-center gap-0.5">
          <Eye className="h-3 w-3" />
          {t.blog.views(post.views)}
        </span>
      </div>

      {/* Content + TOC */}
      <div className="mt-6 flex gap-8">
        <div className="min-w-0 flex-1 max-w-[680px]">
          <PostContent content={post.content} />
        </div>
        <aside className="hidden w-52 shrink-0 lg:block">
          <TableOfContents content={post.content} label={t.blog.toc} />
        </aside>
      </div>

      {/* Share */}
      <div className="mt-8">
        <ShareButtons
          url={url}
          title={post.title}
          labels={{
            shareLink: t.blog.shareLink,
            shareTwitter: t.blog.shareTwitter,
            shareLinkedIn: t.blog.shareLinkedIn,
            linkCopied: t.blog.linkCopied,
          }}
        />
      </div>

      {/* Divider + Related */}
      {relatedPosts.length > 0 && (
        <>
          <hr className="my-8 border-gray-200" />
          <RelatedPosts
            posts={relatedPosts}
            label={t.blog.relatedPosts}
            readingTimeLabel={t.blog.readingTime}
            viewsLabel={t.blog.views}
          />
        </>
      )}
      {/* Scroll to top */}
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-40 rounded-full bg-indigo-600 p-3 text-white shadow-lg transition-all hover:bg-indigo-700 active:scale-95"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </article>
  );
}

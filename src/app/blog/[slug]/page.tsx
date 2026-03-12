"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/** Backward-compatible redirect: /blog/[slug] → /blog/[category]/[slug] */
export default function BlogPostRedirect() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/blog/${slug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          const catSlug = data.category?.slug || "posts";
          router.replace(`/blog/${catSlug}/${slug}`);
        }
      });
  }, [slug, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
    </div>
  );
}

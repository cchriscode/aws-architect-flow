"use client";

import { useEffect, useState } from "react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
  label: string;
}

export function TableOfContents({ content, label }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState("");

  /* Read actual heading IDs from the rendered DOM (set by rehype-slug) */
  useEffect(() => {
    const timer = setTimeout(() => {
      const root = document.querySelector(".prose-custom");
      if (!root) return;
      const els = root.querySelectorAll("h1, h2, h3");
      const items: TocItem[] = [];
      els.forEach((el) => {
        if (el.id) {
          items.push({
            id: el.id,
            text: el.textContent ?? "",
            level: parseInt(el.tagName[1], 10),
          });
        }
      });
      setHeadings(items);
    }, 100);
    return () => clearTimeout(timer);
  }, [content]);

  /* Scroll-spy via IntersectionObserver */
  useEffect(() => {
    if (headings.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -70% 0px" },
    );
    for (const h of headings) {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav className="hidden lg:block">
      <div className="sticky top-24">
        <p className="mb-2 text-xs font-bold text-gray-500">{label}</p>
        <ul className="space-y-1 border-l border-gray-200">
          {headings.map((h) => (
            <li key={h.id}>
              <a
                href={`#${h.id}`}
                className={`block border-l-2 py-1 text-xs transition-colors ${
                  h.level === 2 ? "pl-3" : h.level === 3 ? "pl-5" : "pl-3"
                } ${
                  activeId === h.id
                    ? "border-indigo-600 font-medium text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {h.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

"use client";

import Link from "next/link";

interface TagPillProps {
  tag: string;
  active?: boolean;
  onClick?: () => void;
  href?: string;
}

export function TagPill({ tag, active, onClick, href }: TagPillProps) {
  const cls = `inline-block rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
    active
      ? "bg-indigo-600 text-white"
      : "border-[1.5px] border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
  }`;

  if (href) {
    return (
      <Link href={href} className={cls}>
        #{tag}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={cls}>
      #{tag}
    </button>
  );
}

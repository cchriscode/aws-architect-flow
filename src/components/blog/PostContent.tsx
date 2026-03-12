"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import type { Components } from "react-markdown";

/* ── Mermaid lightbox modal ── */
function MermaidModal({ svg, onClose }: { svg: string; onClose: () => void }) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] max-w-[90vw] overflow-auto rounded-xl bg-white p-8 pt-12 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full bg-gray-100 p-1.5 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
        <div
          className="flex min-h-[200px] min-w-[300px] items-center justify-center"
          ref={(el) => {
            if (!el) return;
            el.innerHTML = svg;
            const svgEl = el.querySelector("svg");
            if (svgEl) {
              svgEl.removeAttribute("width");
              svgEl.removeAttribute("height");
              svgEl.style.maxWidth = "100%";
              svgEl.style.maxHeight = "80vh";
              svgEl.style.width = "auto";
              svgEl.style.height = "auto";
              svgEl.style.minWidth = "400px";
            }
          }}
        />
      </div>
    </div>
  );
}

/* ── Mermaid block ── */
function MermaidBlock({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [svgHtml, setSvgHtml] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    import("mermaid").then((m) => {
      if (cancelled) return;
      m.default.initialize({
        startOnLoad: false,
        theme: "neutral",
        fontFamily: "Pretendard, sans-serif",
      });
      const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
      m.default.render(id, chart).then(({ svg }) => {
        if (!cancelled) {
          setSvgHtml(svg);
          if (ref.current) ref.current.innerHTML = svg;
        }
      });
    });
    return () => {
      cancelled = true;
    };
  }, [chart]);

  return (
    <>
      <div
        ref={ref}
        onClick={() => svgHtml && setOpen(true)}
        title="클릭하면 크게 볼 수 있습니다"
        className="my-4 flex cursor-pointer justify-center overflow-x-auto rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
      />
      {open && <MermaidModal svg={svgHtml} onClose={() => setOpen(false)} />}
    </>
  );
}

/* ── Markdown components ── */
function CodeBlock({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) {
  const isInline = !className;
  if (isInline) {
    return (
      <code
        className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono text-indigo-700"
        {...props}
      >
        {children}
      </code>
    );
  }
  return (
    <code className={`${className ?? ""} text-xs`} {...props}>
      {children}
    </code>
  );
}

function PreBlock({
  children,
  ...props
}: React.HTMLAttributes<HTMLPreElement> & { children?: React.ReactNode }) {
  // Detect mermaid code block
  const child = children as React.ReactElement<{
    className?: string;
    children?: string;
  }> | undefined;
  if (child?.props?.className === "language-mermaid") {
    const chart =
      typeof child.props.children === "string"
        ? child.props.children.trim()
        : "";
    return <MermaidBlock chart={chart} />;
  }

  return (
    <pre
      className="my-4 overflow-x-auto rounded-lg border border-green-200 bg-green-50 p-4 text-xs text-gray-800"
      {...props}
    >
      {children}
    </pre>
  );
}

const components: Components = {
  h1: ({ children, ...props }) => (
    <h1 className="mt-8 mb-4 text-xl font-extrabold text-gray-900" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="mt-7 mb-3 text-lg font-bold text-gray-900" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="mt-5 mb-2 text-base font-bold text-gray-800" {...props}>
      {children}
    </h3>
  ),
  p: ({ children, ...props }) => (
    <p className="my-3 text-sm leading-relaxed text-gray-700" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }) => (
    <ul className="my-3 ml-5 list-disc space-y-1 text-sm text-gray-700" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="my-3 ml-5 list-decimal space-y-1 text-sm text-gray-700" {...props}>
      {children}
    </ol>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="my-4 border-l-[3px] border-indigo-300 bg-indigo-50/50 py-2 pl-4 text-sm text-gray-700"
      {...props}
    >
      {children}
    </blockquote>
  ),
  code: CodeBlock as Components["code"],
  pre: PreBlock as Components["pre"],
  table: ({ children, ...props }) => (
    <div className="my-4 overflow-x-auto">
      <table className="w-full border-collapse text-sm" {...props}>
        {children}
      </table>
    </div>
  ),
  th: ({ children, ...props }) => (
    <th className="border border-gray-200 bg-gray-50 px-3 py-2 text-left text-xs font-bold text-gray-700" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="border border-gray-200 px-3 py-2 text-xs text-gray-600" {...props}>
      {children}
    </td>
  ),
  img: ({ src, alt, ...props }) => (
    <img
      src={src}
      alt={alt ?? ""}
      className="my-4 max-w-full rounded-lg"
      loading="lazy"
      {...props}
    />
  ),
  a: ({ href, children, ...props }) => (
    <a
      href={href}
      className="text-indigo-600 underline decoration-indigo-300 hover:text-indigo-700"
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
      {...props}
    >
      {children}
    </a>
  ),
  hr: () => <hr className="my-6 border-gray-200" />,
};

interface PostContentProps {
  content: string;
}

export function PostContent({ content }: PostContentProps) {
  return (
    <div className="prose-custom">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSlug]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

"use client";

import { useDict } from "@/lib/i18n/context";

export default function PrivacyPage() {
  const t = useDict();

  return (
    <main className="max-w-2xl mx-auto px-6 py-16 text-sm text-gray-700 dark:text-gray-300">
      <h1 className="text-2xl font-bold mb-8 text-gray-900 dark:text-white">{t.privacy.title}</h1>
      <p className="mb-4">{t.privacy.lastUpdated}</p>

      {t.privacy.sections.map((section, i) => (
        <section key={i} className="mb-6">
          <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">{section.heading}</h2>
          <p>{section.content}</p>
          {section.list && (
            <ul className="list-disc ml-6 mt-2 space-y-1">
              {section.list.map((item, j) => (
                <li key={j}>{item}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </main>
  );
}

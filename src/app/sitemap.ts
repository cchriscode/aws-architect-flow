import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://archflow-aws.online", lastModified: new Date(), priority: 1.0 },
    { url: "https://archflow-aws.online/glossary", lastModified: new Date(), priority: 0.8 },
    { url: "https://archflow-aws.online/login", lastModified: new Date(), priority: 0.5 },
    { url: "https://archflow-aws.online/privacy", lastModified: new Date(), priority: 0.3 },
  ];
}

import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/history", "/admin/"] },
    sitemap: "https://archflow-aws.online/sitemap.xml",
  };
}

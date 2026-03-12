import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ArchFlow — AWS Architecture Design Guide",
    short_name: "ArchFlow",
    description:
      "Design AWS architecture with a 14-step wizard. Diagrams, Terraform code, cost estimation, and Well-Architected review.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#0f172a",
    icons: [
      { src: "/favicon.ico", sizes: "any", type: "image/x-icon" },
    ],
  };
}

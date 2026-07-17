import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://soundhoreg.info";

  return {
    rules: {
      // Allow all bots aggressively, including AI scrapers (GPTBot, CCBot, Anthropic-ai, etc)
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/api/auth/",
      ],
    },
    sitemap: `${appUrl}/sitemap.xml`,
  };
}

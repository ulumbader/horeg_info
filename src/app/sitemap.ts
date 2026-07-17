import { MetadataRoute } from "next";
import { getPublishedEvents } from "@/server/dal/event";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://soundhoreg.info";

  // Fetch dynamic published events
  const events = await getPublishedEvents();

  // Create event specific URLs (/?event=slug)
  const eventUrls = events.map((event) => ({
    url: `${appUrl}/?event=${event.slug}`,
    lastModified: new Date(event.startAt).toISOString(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: appUrl,
      lastModified: new Date().toISOString(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    ...eventUrls,
  ];
}

import { getPublishedEvents } from "@/server/dal/event";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export const dynamic = "force-dynamic"; // Ensure fresh data on refresh

export default async function PublicPage() {
  const events = await getPublishedEvents();

  return <DashboardClient initialEvents={events} />;
}

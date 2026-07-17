import { requireAdmin } from "@/server/auth";
import { EventForm } from "@/components/admin/EventForm";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { DeleteEventDialog } from "@/components/admin/DeleteEventDialog";
import { getAdminEventById } from "@/server/dal/event";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const event = await getAdminEventById(id);

  if (!event) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/events" aria-label="Kembali ke daftar acara" className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Edit Acara</h1>
            <p className="text-muted-foreground text-sm">ID: {event.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {event.publicationStatus === "PUBLISHED" && (
            <Button asChild className="bg-transparent text-foreground hover:bg-accent border border-input h-9 px-3 text-sm">
              <Link href={`/?event=${event.slug}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Lihat Publik
              </Link>
            </Button>
          )}
          <DeleteEventDialog eventId={event.id} eventTitle={event.title} />
        </div>
      </div>

      <EventForm initialData={event} />
    </div>
  );
}

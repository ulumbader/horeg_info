import { requireAdmin } from "@/server/auth";
import { EventForm } from "@/components/admin/EventForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NewEventPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/events" aria-label="Kembali ke daftar acara" className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tambah Acara Baru</h1>
          <p className="text-muted-foreground text-sm">Buat data acara peringatan dini yang baru.</p>
        </div>
      </div>
      
      <EventForm />
    </div>
  );
}

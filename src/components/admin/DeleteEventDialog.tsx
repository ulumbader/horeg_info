"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteEvent } from "@/server/actions/event";
import { Button } from "@/components/ui/Button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";

export function DeleteEventDialog({ eventId, eventTitle }: { eventId: string, eventTitle: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");

  const handleDelete = async () => {
    if (confirmTitle !== eventTitle) return;

    setIsDeleting(true);
    try {
      const res = await deleteEvent(eventId);
      if (res.success) {
        toast.success("Acara berhasil dihapus permanen");
        router.push("/admin/events");
        setOpen(false);
      } else {
        toast.error(res.error || "Gagal menghapus acara");
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 hover:text-red-700 h-9 px-3">
          <Trash2 className="w-4 h-4 mr-2" />
          Hapus
        </Button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="motion-overlay fixed inset-0 bg-background/80 backdrop-blur-sm z-50" />
        <Dialog.Content className="motion-dialog fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-background border p-6 rounded-xl shadow-xl z-50">
          <Dialog.Title className="text-xl font-bold text-destructive">Hapus Permanen Acara</Dialog.Title>
          <Dialog.Description className="mt-3 text-sm text-muted-foreground space-y-4">
            <p>
              Tindakan ini tidak dapat dibatalkan. Acara <strong>{eventTitle}</strong> akan dihapus permanen dari sistem beserta seluruh log dan referensinya.
            </p>
            <div className="bg-destructive/10 p-4 rounded-lg">
              <p className="mb-2 text-destructive font-medium">Ketik nama acara untuk konfirmasi:</p>
              <p className="font-mono text-xs mb-3 select-all bg-background/50 p-2 rounded">{eventTitle}</p>
              <input
                aria-label="Konfirmasi nama acara"
                type="text"
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={confirmTitle}
                onChange={(e) => setConfirmTitle(e.target.value)}
                placeholder={eventTitle}
              />
            </div>
          </Dialog.Description>

          <div className="mt-6 flex justify-end gap-3">
            <Dialog.Close asChild>
              <Button className="bg-transparent border border-input text-foreground hover:bg-accent" disabled={isDeleting}>Batal</Button>
            </Dialog.Close>
            <Button
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={confirmTitle !== eventTitle || isDeleting}
            >
              {isDeleting ? "Menghapus..." : "Ya, Hapus Permanen"}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

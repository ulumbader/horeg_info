"use client";

import { useState } from "react";
import { updateProfileAction } from "@/server/actions/settings";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "sonner";
import { User } from "lucide-react";

export function ProfileSettings({ currentName, currentEmail }: { currentName: string, currentEmail: string }) {
  const [name, setName] = useState(currentName);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || name.length < 2) {
      toast.error("Nama minimal 2 karakter");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const res = await updateProfileAction({ name });
      if (res.success) {
        toast.success("Profil berhasil diperbarui");
      } else {
        toast.error(res.error || "Gagal memperbarui profil");
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div className="flex items-center gap-2 pb-2 border-b">
        <User className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Informasi Profil</h3>
      </div>
      
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="profile-email">Email (Read-only)</label>
        <Input id="profile-email" type="email" value={currentEmail} disabled className="bg-muted/50" />
        <p className="text-xs text-muted-foreground">Pengubahan email administrator dinonaktifkan demi keamanan. Hubungi teknisi untuk mengganti.</p>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="profile-name">Nama Admin</label>
        <Input id="profile-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
      </div>

      <Button type="submit" disabled={isSubmitting || name === currentName} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
        {isSubmitting ? "Menyimpan..." : "Simpan Profil"}
      </Button>
    </form>
  );
}

"use client";

import { useState } from "react";
import { changePasswordAction, revokeOtherSessionsAction } from "@/server/actions/settings";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "sonner";
import { Shield, ShieldAlert, LogOut } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";

export function SecuritySettings() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error("Password baru minimal 8 karakter");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi password baru tidak cocok");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await changePasswordAction({ currentPassword, newPassword, revokeOtherSessions: true });
      if (res.success) {
        toast.success("Password berhasil diubah. Sesi lain otomatis dicabut.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(res.error || "Gagal mengubah password");
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevokeSessions = async () => {
    try {
      const res = await revokeOtherSessionsAction();
      if (res.success) {
        toast.success("Semua sesi di perangkat lain berhasil dicabut");
        setRevokeOpen(false);
      } else {
        toast.error(res.error || "Gagal mencabut sesi");
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Terjadi kesalahan");
    }
  };

  return (
    <div className="space-y-8 max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b">
          <Shield className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Ganti Password</h3>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="current-password">Password Saat Ini</label>
          <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="new-password">Password Baru</label>
          <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
          <p className="text-xs text-muted-foreground">Minimal 8 karakter.</p>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="confirm-password">Konfirmasi Password Baru</label>
          <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} />
        </div>

        <Button type="submit" disabled={isSubmitting || !currentPassword || !newPassword} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
          {isSubmitting ? "Mengubah..." : "Ubah Password"}
        </Button>
      </form>

      <div className="space-y-4 pt-6 border-t border-destructive/20">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-destructive" />
          <h3 className="font-semibold text-destructive">Keamanan Sesi</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Jika Anda merasa ada aktivitas mencurigakan, cabut akses dari semua perangkat lain yang saat ini masuk dengan akun ini.
        </p>

        <Dialog.Root open={revokeOpen} onOpenChange={setRevokeOpen}>
          <Dialog.Trigger asChild>
            <Button className="w-full bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 hover:text-red-700">
              <LogOut className="w-4 h-4 mr-2" />
              Cabut Sesi Lainnya
            </Button>
          </Dialog.Trigger>

          <Dialog.Portal>
            <Dialog.Overlay className="motion-overlay fixed inset-0 bg-background/80 backdrop-blur-sm z-50" />
            <Dialog.Content className="motion-dialog fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-background border p-6 rounded-xl shadow-xl z-50">
              <Dialog.Title className="text-xl font-bold text-destructive">Konfirmasi Cabut Sesi</Dialog.Title>
              <Dialog.Description className="mt-3 text-sm text-muted-foreground">
                Tindakan ini akan mengeluarkan (logout) perangkat lain yang saat ini menggunakan akun Anda. Anda akan tetap masuk di perangkat ini.
              </Dialog.Description>

              <div className="mt-6 flex justify-end gap-3">
                <Dialog.Close asChild>
                  <Button className="bg-transparent border border-input text-foreground hover:bg-accent">Batal</Button>
                </Dialog.Close>
                <Button className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleRevokeSessions}>
                  Ya, Cabut Sesi
                </Button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </div>
  );
}

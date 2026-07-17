"use client";

import { useState } from "react";
import { saveAppSettingAction } from "@/server/actions/settings";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "sonner";
import { Settings } from "lucide-react";

export function AppSettingsForm({ defaultSettings }: { defaultSettings: Record<string, string> }) {
  const [settings, setSettings] = useState(defaultSettings);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Save all changed settings
      const promises = Object.entries(settings).map(([key, value]) => {
        if (value !== defaultSettings[key]) {
          return saveAppSettingAction(key, value);
        }
        return Promise.resolve({ success: true });
      });

      const results = await Promise.all(promises);
      const hasError = results.some(r => !r.success);

      if (hasError) {
        toast.error("Gagal menyimpan beberapa pengaturan");
      } else {
        toast.success("Pengaturan aplikasi berhasil disimpan");
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div className="flex items-center gap-2 pb-2 border-b">
        <Settings className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Konfigurasi Aplikasi</h3>
      </div>
      
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="app-announcement">Teks Pengumuman Header (Opsional)</label>
        <Input 
          id="app-announcement"
          type="text" 
          value={settings["APP_HEADER_ANNOUNCEMENT"] || ""} 
          onChange={(e) => handleChange("APP_HEADER_ANNOUNCEMENT", e.target.value)} 
          placeholder="Contoh: Pemeliharaan sistem tanggal 30..."
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="app-contact">Email Kontak Publik</label>
        <Input 
          id="app-contact"
          type="email" 
          value={settings["APP_PUBLIC_CONTACT"] || ""} 
          onChange={(e) => handleChange("APP_PUBLIC_CONTACT", e.target.value)} 
          placeholder="info@soundhoregews.id"
        />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
        {isSubmitting ? "Menyimpan..." : "Simpan Pengaturan"}
      </Button>
    </form>
  );
}

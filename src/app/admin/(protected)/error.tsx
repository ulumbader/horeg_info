"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 space-y-6">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <div className="space-y-2 max-w-md">
        <h2 className="text-xl font-bold tracking-tight">Terjadi Kesalahan</h2>
        <p className="text-sm text-muted-foreground">
          Sistem gagal memuat data halaman ini. Ini mungkin disebabkan oleh gangguan koneksi atau masalah server sementara.
        </p>
        <div className="bg-muted p-3 rounded text-left text-xs font-mono text-muted-foreground overflow-auto max-h-32 mt-4">
          {error.message || "Unknown error"}
        </div>
      </div>
      <Button onClick={() => reset()} className="gap-2">
        <RefreshCcw className="w-4 h-4" /> Coba Lagi
      </Button>
    </div>
  );
}

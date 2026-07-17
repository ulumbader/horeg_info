"use client";

import { Map as MapIcon, Lock } from "lucide-react";

export function MapPlaceholder() {
  return (
    <div className="absolute inset-0 bg-muted/20 flex flex-col items-center justify-center p-6 text-center z-0 overflow-hidden">
      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
      
      <div className="relative z-10 max-w-sm flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 text-primary">
          <MapIcon className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold mb-2">Peta Interaktif</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Modul pemetaan geospasial dan visualisasi radius kebisingan akan diimplementasikan pada Fase 06 (Integrasi Leaflet).
        </p>
        <div className="flex items-center gap-2 text-xs font-medium text-amber-600 bg-amber-500/10 px-3 py-1.5 rounded-full">
          <Lock className="w-3 h-3" />
          Fase Selanjutnya
        </div>
      </div>
      
      {/* Abstract decorative circles to imply map radius */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border border-primary/10 rounded-full"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-primary/5 rounded-full"></div>
    </div>
  );
}

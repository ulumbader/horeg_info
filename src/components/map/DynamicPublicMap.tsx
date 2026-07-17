"use client";

import dynamic from "next/dynamic";
import { PublicSoundEventDTO } from "@/server/dal/event";

// Import PublicMap dynamically with SSR disabled
const PublicMap = dynamic(() => import("./PublicMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-muted/20">
      <div className="flex flex-col items-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
        <p className="text-sm text-muted-foreground font-medium animate-pulse">Memuat Peta...</p>
      </div>
    </div>
  ),
});

interface DynamicPublicMapProps {
  events: PublicSoundEventDTO[];
  selectedSlug: string | null;
  onSelectEvent: (slug: string) => void;
  userLocation?: { latitude: number; longitude: number } | null;
  isVisible: boolean;
}

export function DynamicPublicMap(props: DynamicPublicMapProps) {
  return <PublicMap {...props} />;
}

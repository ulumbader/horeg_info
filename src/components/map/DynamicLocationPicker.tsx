"use client";

import dynamic from "next/dynamic";

const LocationPickerMap = dynamic(() => import("./LocationPickerMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-muted/20 border rounded-md">
      <p className="text-sm text-muted-foreground animate-pulse">Memuat Peta Picker...</p>
    </div>
  ),
});

export function DynamicLocationPicker(props: React.ComponentProps<typeof LocationPickerMap>) {
  return <LocationPickerMap {...props} />;
}

"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { EventSchema, EventFormData } from "@/lib/validations/event";
import { createEvent, updateEvent } from "@/server/actions/event";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { AdminLocationPicker } from "@/components/admin/AdminLocationPicker";
import { calculateRadiusForThreshold, NOISE_THRESHOLDS } from "@/lib/domain/noise";
import { PublicSoundEventDTO } from "@/server/dal/event";
import { createSlug } from "@/lib/domain/slug";

interface EventFormProps {
  initialData?: PublicSoundEventDTO;
}

const formatDateForLocalInput = (dateInput: Date | string | number) => {
  const date = new Date(dateInput);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export function EventForm({ initialData }: EventFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioAction, setAudioAction] = useState<"KEEP" | "REPLACE" | "REMOVE">("KEEP");
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(initialData?.audioStreamUrl ?? null);
  const localAudioPreviewRef = useRef<string | null>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  
  const form = useForm<z.input<typeof EventSchema>, unknown, EventFormData>({
    resolver: zodResolver(EventSchema),
    defaultValues: initialData ? {
      title: initialData.title,
      slug: initialData.slug,
      summary: initialData.summary,
      description: initialData.description,
      venueName: initialData.venueName,
      address: initialData.address,
      district: initialData.district,
      city: initialData.city,
      province: initialData.province,
      latitude: initialData.latitude,
      longitude: initialData.longitude,
      sourceDb: initialData.sourceDb,
      sourcePlatform: initialData.sourcePlatform,
      sourceUrl: initialData.sourceUrl,
      sourceAccount: initialData.sourceAccount,
      audioTitle: initialData.audioTitle,
      // Handle Date formats for HTML date-local input
      startAt: formatDateForLocalInput(initialData.startAt),
      endAt: formatDateForLocalInput(initialData.endAt),
      publicationStatus: initialData.publicationStatus as "DRAFT" | "PUBLISHED" | "ARCHIVED",
    } : {
      publicationStatus: "DRAFT",
      sourceDb: 100,
    }
  });

  const { register, handleSubmit, control, setValue, formState: { errors } } = form;

  const rawLat = useWatch({ control, name: "latitude" });
  const rawLng = useWatch({ control, name: "longitude" });
  const sourceDb = useWatch({ control, name: "sourceDb" });
  const title = useWatch({ control, name: "title" });
  const venueName = useWatch({ control, name: "venueName" });
  const address = useWatch({ control, name: "address" });
  const district = useWatch({ control, name: "district" });
  const city = useWatch({ control, name: "city" });
  const province = useWatch({ control, name: "province" });
  const lat = typeof rawLat === "number" && Number.isFinite(rawLat) ? rawLat : null;
  const lng = typeof rawLng === "number" && Number.isFinite(rawLng) ? rawLng : null;

  const handleLocationSelect = useCallback((latitude: number, longitude: number) => {
    const normalizedLatitude = Number(latitude.toFixed(6));
    const normalizedLongitude = Number(longitude.toFixed(6));
    setValue("latitude", normalizedLatitude, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    setValue("longitude", normalizedLongitude, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
  }, [setValue]);

  const handleClearLocation = useCallback(() => {
    setValue("latitude", undefined, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    setValue("longitude", undefined, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
  }, [setValue]);

  // Auto generate slug from title if new
  useEffect(() => {
    if (!initialData && title) {
      const generated = createSlug(title);
      setValue("slug", generated, { shouldValidate: true });
    }
  }, [title, initialData, setValue]);

  useEffect(() => () => {
    if (localAudioPreviewRef.current) URL.revokeObjectURL(localAudioPreviewRef.current);
  }, []);

  const resetLocalAudio = () => {
    if (localAudioPreviewRef.current) URL.revokeObjectURL(localAudioPreviewRef.current);
    localAudioPreviewRef.current = null;
    setAudioFile(null);
    if (audioInputRef.current) audioInputRef.current.value = "";
  };

  const handleAudioFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".mp3") || !["audio/mpeg", "audio/mp3"].includes(file.type.toLowerCase())) {
      toast.error("File musik harus berformat MP3");
      event.target.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ukuran file MP3 maksimal 10 MB");
      event.target.value = "";
      return;
    }

    resetLocalAudio();
    const previewUrl = URL.createObjectURL(file);
    localAudioPreviewRef.current = previewUrl;
    setAudioFile(file);
    setAudioPreviewUrl(previewUrl);
    setAudioAction("REPLACE");
  };

  const restoreExistingAudio = () => {
    resetLocalAudio();
    setAudioAction("KEEP");
    setAudioPreviewUrl(initialData?.audioStreamUrl ?? null);
  };

  const removeAudio = () => {
    resetLocalAudio();
    setAudioAction(initialData?.hasAudio ? "REMOVE" : "KEEP");
    setAudioPreviewUrl(null);
  };

  const onSubmit = async (data: EventFormData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      const audioUpload = new FormData();
      audioUpload.set("audioAction", audioAction);
      if (audioFile) audioUpload.set("audioFile", audioFile, audioFile.name);

      let res;
      if (initialData?.id) {
        res = await updateEvent(initialData.id, data, audioUpload);
      } else {
        res = await createEvent(data, audioUpload);
      }

      if (res.success) {
        toast.success(initialData ? "Acara berhasil diperbarui" : "Acara berhasil dibuat");
        router.push("/admin/events");
      } else {
        toast.error(res.error || "Gagal menyimpan acara");
        if (res.details) console.error("Validation errors:", res.details);
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan acara");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="motion-card space-y-8 bg-card p-4 sm:p-6 rounded-xl border shadow-sm" aria-label="Formulir acara">
      {Object.keys(errors).length > 0 && (
        <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          Periksa kembali kolom yang ditandai sebelum menyimpan acara.
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* INFORMASI DASAR */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold border-b pb-2">Informasi Dasar</h2>
          
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="title">Judul Acara *</label>
            <Input id="title" {...register("title")} placeholder="Contoh: Karnaval Sound System" aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? "title-error" : undefined} className={errors.title ? "border-destructive" : ""} />
            {errors.title && <p id="title-error" className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="slug">Slug (URL) *</label>
            <Input id="slug" {...register("slug")} placeholder="karnaval-sound-system" aria-invalid={Boolean(errors.slug)} aria-describedby={errors.slug ? "slug-error" : undefined} className={errors.slug ? "border-destructive" : ""} />
            {errors.slug && <p id="slug-error" className="text-xs text-destructive">{errors.slug.message}</p>}
            {initialData && <p className="text-xs text-amber-500">Peringatan: Mengubah slug acara yang sudah terpublikasi dapat merusak tautan eksternal.</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="summary">Ringkasan Singkat</label>
            <Input id="summary" {...register("summary")} placeholder="Satu kalimat tentang acara" />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="description">Deskripsi Lengkap</label>
            <textarea 
              id="description"
              {...register("description")} 
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Detail acara..."
            />
          </div>
        </div>

        {/* JADWAL & LOKASI */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold border-b pb-2">Jadwal & Lokasi</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="startAt">Waktu Mulai *</label>
              <Input 
                id="startAt"
                type="datetime-local" 
                {...register("startAt", { valueAsDate: true })} 
                className={errors.startAt ? "border-destructive" : ""} 
              />
              {errors.startAt && <p className="text-xs text-destructive">{errors.startAt.message}</p>}
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="endAt">Waktu Selesai *</label>
              <Input 
                id="endAt"
                type="datetime-local" 
                {...register("endAt", { valueAsDate: true })} 
                className={errors.endAt ? "border-destructive" : ""} 
              />
              {errors.endAt && <p className="text-xs text-destructive">{errors.endAt.message}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="venueName">Nama Lokasi/Venue</label>
            <Input id="venueName" {...register("venueName")} placeholder="Lapangan Desa X" />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="district">Kecamatan/Distrik</label>
            <Input id="district" {...register("district")} placeholder="Contoh: Kepanjen" />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="address">Alamat Lengkap *</label>
            <Input id="address" {...register("address")} className={errors.address ? "border-destructive" : ""} />
            {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="city">Kabupaten/Kota *</label>
              <Input id="city" {...register("city")} className={errors.city ? "border-destructive" : ""} />
              {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="province">Provinsi *</label>
              <Input id="province" {...register("province")} className={errors.province ? "border-destructive" : ""} />
              {errors.province && <p className="text-xs text-destructive">{errors.province.message}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* SUMBER & ESTIMASI SUARA */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold border-b pb-2">Sumber Informasi & Estimasi Suara</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="sourcePlatform">Platform Sumber *</label>
            <Input id="sourcePlatform" {...register("sourcePlatform")} placeholder="Instagram, Facebook, dsb." className={errors.sourcePlatform ? "border-destructive" : ""} />
            {errors.sourcePlatform && <p className="text-xs text-destructive">{errors.sourcePlatform.message}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="sourceUrl">URL Referensi *</label>
            <Input id="sourceUrl" {...register("sourceUrl")} type="url" placeholder="https://..." className={errors.sourceUrl ? "border-destructive" : ""} />
            {errors.sourceUrl && <p className="text-xs text-destructive">{errors.sourceUrl.message}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="sourceAccount">Akun Pengunggah</label>
            <Input id="sourceAccount" {...register("sourceAccount")} placeholder="@akuninfo" />
          </div>
        </div>

        <div className="rounded-xl border border-primary/15 bg-primary/5 p-4">
          <div className="mb-3">
            <h3 className="text-sm font-semibold">Musik Pengalaman Acara</h3>
            <p className="mt-1 text-xs text-muted-foreground">Opsional. Unggah MP3 maksimal 10 MB. File disimpan bersama acara dan baru diputar setelah pengguna mengklik acara.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="audioTitle">Judul Musik</label>
              <Input id="audioTitle" {...register("audioTitle")} placeholder="Contoh: Intro Sound System" aria-invalid={Boolean(errors.audioTitle)} aria-describedby={errors.audioTitle ? "audio-title-error" : undefined} />
              {errors.audioTitle && <p id="audio-title-error" className="text-xs text-destructive">{errors.audioTitle.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="audioFile">File MP3</label>
              <Input ref={audioInputRef} id="audioFile" type="file" accept=".mp3,audio/mpeg,audio/mp3" onChange={handleAudioFileChange} />
              <p className="text-xs text-muted-foreground">MP3 saja, maksimal 10 MB. Isi file diverifikasi kembali di server.</p>
            </div>
          </div>
          {audioAction === "REMOVE" && (
            <div role="status" className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              <span>Musik lama akan dihapus saat perubahan disimpan.</span>
              <Button type="button" onClick={restoreExistingAudio} className="h-8 bg-background px-3 text-foreground hover:bg-muted">Batalkan hapus</Button>
            </div>
          )}
          {audioPreviewUrl && audioAction !== "REMOVE" && (
            <div className="motion-notice mt-4 rounded-lg border bg-background p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium">Preview musik</p>
                  <p className="text-[11px] text-muted-foreground">{audioFile?.name ?? initialData?.audioFileName ?? "musik-acara.mp3"}</p>
                </div>
                <div className="flex gap-2">
                  {audioAction === "REPLACE" && initialData?.hasAudio && (
                    <Button type="button" onClick={restoreExistingAudio} className="h-8 bg-transparent px-3 text-foreground hover:bg-muted">Batalkan ganti</Button>
                  )}
                  <Button type="button" onClick={removeAudio} className="h-8 bg-destructive/10 px-3 text-destructive hover:bg-destructive/20">Hapus musik</Button>
                </div>
              </div>
              {/* Musik acara tidak memiliki dialog lisan yang memerlukan track caption. */}
              <audio key={audioPreviewUrl} controls preload="metadata" className="h-10 w-full" src={audioPreviewUrl}>
                Browser tidak mendukung pemutar audio.
              </audio>
            </div>
          )}
        </div>

        <div className="bg-muted p-4 rounded-lg mt-4">
          <div className="space-y-1 max-w-sm">
            <label className="text-sm font-medium flex justify-between" htmlFor="sourceDb">
              <span>Estimasi Volume Sumber (dB) *</span>
              <span className="font-bold text-primary">{sourceDb || 0} dB</span>
            </label>
            <Input 
              type="number" 
              id="sourceDb"
              {...register("sourceDb", { valueAsNumber: true })} 
              className={errors.sourceDb ? "border-destructive bg-background" : "bg-background"} 
              min={80} max={160}
            />
            {errors.sourceDb && <p className="text-xs text-destructive">{errors.sourceDb.message}</p>}
          </div>
          
          <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
            <div className="bg-red-500/10 text-red-700 p-2 rounded text-center">
              <p className="font-semibold mb-1">Zona Bahaya (&gt;{NOISE_THRESHOLDS.DANGER}dB)</p>
              <p>{Math.round(calculateRadiusForThreshold(sourceDb || 0, NOISE_THRESHOLDS.DANGER))} meter</p>
            </div>
            <div className="bg-amber-500/10 text-amber-700 p-2 rounded text-center">
              <p className="font-semibold mb-1">Zona Waspada (&gt;{NOISE_THRESHOLDS.WARNING}dB)</p>
              <p>{Math.round(calculateRadiusForThreshold(sourceDb || 0, NOISE_THRESHOLDS.WARNING))} meter</p>
            </div>
            <div className="bg-green-500/10 text-green-700 p-2 rounded text-center">
              <p className="font-semibold mb-1">Zona Aman (&lt;{NOISE_THRESHOLDS.WARNING}dB)</p>
              <p>&gt; {Math.round(calculateRadiusForThreshold(sourceDb || 0, NOISE_THRESHOLDS.WARNING))} meter</p>
            </div>
          </div>
        </div>
      </div>

      {/* MAP PICKER */}
      <div className="space-y-4">
        <div className="border-b pb-2">
          <h2 className="text-lg font-bold">Tandai Lokasi di Peta</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Cari alamat, klik peta, geser marker, atau masukkan koordinat secara manual.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="latitude">Latitude *</label>
            <Input
              id="latitude"
              type="number"
              step="any"
              inputMode="decimal"
              {...register("latitude", { valueAsNumber: true })}
              aria-invalid={Boolean(errors.latitude)}
              aria-describedby={errors.latitude ? "latitude-error" : "latitude-help"}
              className={errors.latitude ? "border-destructive bg-background" : "bg-background"}
            />
            <p id="latitude-help" className="text-xs text-muted-foreground">Rentang -90 hingga 90.</p>
            {errors.latitude && <p id="latitude-error" className="text-xs text-destructive">{errors.latitude.message}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="longitude">Longitude *</label>
            <Input
              id="longitude"
              type="number"
              step="any"
              inputMode="decimal"
              {...register("longitude", { valueAsNumber: true })}
              aria-invalid={Boolean(errors.longitude)}
              aria-describedby={errors.longitude ? "longitude-error" : "longitude-help"}
              className={errors.longitude ? "border-destructive bg-background" : "bg-background"}
            />
            <p id="longitude-help" className="text-xs text-muted-foreground">Rentang -180 hingga 180.</p>
            {errors.longitude && <p id="longitude-error" className="text-xs text-destructive">{errors.longitude.message}</p>}
          </div>
        </div>

        <AdminLocationPicker
          latitude={lat}
          longitude={lng}
          addressParts={[venueName, address, district, city, province]}
          onLocationSelect={handleLocationSelect}
          onClearLocation={handleClearLocation}
        />
      </div>

      {/* STATUS & ACTIONS */}
      <div className="pt-6 border-t flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="space-y-1 w-full md:w-auto">
          <label className="text-sm font-medium" htmlFor="publicationStatus">Status Publikasi</label>
          <select 
            id="publicationStatus"
            {...register("publicationStatus")}
            className="flex h-10 w-full md:w-48 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="DRAFT">DRAFT - Sembunyikan</option>
            <option value="PUBLISHED">PUBLISHED - Tampilkan Publik</option>
            {initialData && <option value="ARCHIVED">ARCHIVED - Arsipkan</option>}
          </select>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <Button type="button" className="flex-1 md:flex-none bg-transparent border border-input text-foreground hover:bg-accent" onClick={() => router.back()} disabled={isSubmitting}>
            Batal
          </Button>
          <Button type="submit" className="flex-1 md:flex-none bg-primary text-primary-foreground hover:bg-primary/90" disabled={isSubmitting}>
            {isSubmitting ? "Menyimpan..." : initialData ? "Simpan Perubahan" : "Buat Acara"}
          </Button>
        </div>
      </div>
    </form>
  );
}

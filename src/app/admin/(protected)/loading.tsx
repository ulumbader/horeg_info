export default function AdminLoading() {
  return (
    <div className="w-full h-[60vh] flex flex-col items-center justify-center space-y-4">
      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      <p className="text-sm text-muted-foreground font-medium animate-pulse">Memuat Data Admin...</p>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Menu, LayoutDashboard, Calendar, MessageCircle, Settings, LogOut, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import * as Dialog from "@radix-ui/react-dialog";

interface AdminShellProps {
  children: React.ReactNode;
  userEmail: string;
  signOutAction: () => Promise<void>;
}

const NAV_ITEMS = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Acara", href: "/admin/events", icon: Calendar },
  { name: "Komentar", href: "/admin/comments", icon: MessageCircle },
  { name: "Pengaturan", href: "/admin/settings", icon: Settings },
];

const SidebarContent = ({
  pathname,
  userEmail,
  signOutAction,
  setIsMobileMenuOpen
}: {
  pathname: string,
  userEmail: string,
  signOutAction: () => Promise<void>,
  setIsMobileMenuOpen: (val: boolean) => void
}) => (
  <div className="flex flex-col h-full bg-background border-r">
    <div className="h-16 flex items-center px-6 border-b shrink-0 gap-3">
      <Image src="/logo.svg" alt="SOUND HOREG.INFO" width={32} height={32} className="w-8 h-8 shrink-0" />
      <h1 className="font-bold text-lg text-primary tracking-tight">EWS Admin</h1>
    </div>

    <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
        const Icon = item.icon;
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={() => setIsMobileMenuOpen(false)}
            className={`motion-control flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium ${isActive
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
          >
            <Icon className="w-5 h-5 shrink-0" />
            {item.name}
          </Link>
        );
      })}
    </nav>

    <div className="p-4 border-t bg-muted/20 shrink-0">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
          {userEmail.charAt(0).toUpperCase()}
        </div>
        <div className="overflow-hidden">
          <p className="text-sm font-medium truncate">{userEmail}</p>
          <p className="text-xs text-muted-foreground">Administrator</p>
        </div>
      </div>

      <form action={signOutAction}>
        <Button type="submit" className="w-full bg-transparent border border-input text-foreground hover:bg-destructive hover:text-destructive-foreground justify-start gap-2 h-9 px-3">
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </form>
    </div>
  </div>
);

export function AdminShell({ children, userEmail, signOutAction }: AdminShellProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getBreadcrumbs = () => {
    const segments = pathname.split("/").filter(Boolean);
    // Base is 'admin'
    if (segments.length <= 1) return "Dashboard";

    // Custom mapping
    if (segments[1] === "events") return "Manajemen Acara";
    if (segments[1] === "comments") return "Komentar Acara";
    if (segments[1] === "settings") return "Pengaturan Sistem";
    return segments[1].charAt(0).toUpperCase() + segments[1].slice(1);
  };

  return (
    <div className="flex h-[100dvh] bg-muted/10 overflow-hidden">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:block w-64 flex-none shadow-sm z-20">
        <SidebarContent pathname={pathname} userEmail={userEmail} signOutAction={signOutAction} setIsMobileMenuOpen={setIsMobileMenuOpen} />
      </aside>

      <Dialog.Root open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="motion-overlay md:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" />
          <Dialog.Content className="motion-sheet-left md:hidden fixed z-50 top-0 bottom-0 left-0 w-72 bg-background shadow-2xl focus:outline-none">
            <Dialog.Title className="sr-only">Navigasi admin</Dialog.Title>
            <Dialog.Description className="sr-only">Pilih halaman admin atau keluar dari sesi.</Dialog.Description>
            <SidebarContent pathname={pathname} userEmail={userEmail} signOutAction={signOutAction} setIsMobileMenuOpen={setIsMobileMenuOpen} />
            <Button
              aria-label="Tutup navigasi admin"
              className="absolute top-3 right-3 p-1.5 h-auto bg-background/50 hover:bg-muted text-muted-foreground"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP BAR */}
        <header className="h-16 flex-none bg-background/80 backdrop-blur border-b flex items-center justify-between px-4 lg:px-8 z-10 sticky top-0">
          <div className="flex items-center gap-3">
            <Button
              aria-label="Buka navigasi admin"
              className="md:hidden p-2 h-auto bg-transparent border border-input text-foreground hover:bg-accent"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <h2 className="font-semibold text-lg">{getBreadcrumbs()}</h2>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </header>

        {/* SCROLLABLE MAIN */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="mx-auto max-w-5xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

"use client";

import { Toaster } from "sonner";
import { useTheme } from "@/components/ThemeProvider";

export function AppToaster() {
  const { resolvedTheme } = useTheme();

  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      theme={resolvedTheme === "dark" ? "dark" : resolvedTheme === "light" ? "light" : "system"}
      toastOptions={{
        classNames: {
          toast: "app-toast",
          title: "app-toast-title",
          description: "app-toast-description",
          actionButton: "app-toast-action",
          cancelButton: "app-toast-cancel",
        },
      }}
    />
  );
}

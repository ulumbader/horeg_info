"use client";

import { useEffect, useRef } from "react";

/**
 * Generate a random visitor ID for session tracking.
 * Stored in sessionStorage so it's unique per browser tab session
 * but not persisted across sessions.
 */
function getOrCreateVisitorId(): string {
  const KEY = "horeg_ews_visitor_id";

  if (typeof window === "undefined") return "";

  let id = sessionStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(KEY, id);
  }
  return id;
}

/**
 * Hook that tracks page views and sends heartbeat signals
 * for real-time online visitor counting.
 *
 * - Records a page view once per mount.
 * - Sends heartbeat every 30 seconds while tab is visible.
 * - Pauses heartbeat when tab is hidden.
 */
export function useAnalytics(path: string = "/") {
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pageViewSentRef = useRef(false);

  useEffect(() => {
    const visitorId = getOrCreateVisitorId();
    if (!visitorId) return;

    // Record page view (once per mount)
    if (!pageViewSentRef.current) {
      pageViewSentRef.current = true;
      fetch("/api/analytics/pageview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      }).catch(() => {
        // Silently ignore — analytics should never break UX
      });
    }

    // Send heartbeat
    const sendHeartbeat = () => {
      fetch("/api/analytics/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId, path }),
      }).catch(() => {
        // Silently ignore
      });
    };

    // Initial heartbeat
    sendHeartbeat();

    // Start periodic heartbeat (every 30 seconds)
    const startHeartbeat = () => {
      if (heartbeatRef.current) return;
      heartbeatRef.current = setInterval(sendHeartbeat, 30_000);
    };

    const stopHeartbeat = () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    };

    startHeartbeat();

    // Pause/resume based on tab visibility
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopHeartbeat();
      } else {
        sendHeartbeat(); // Immediate heartbeat on return
        startHeartbeat();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopHeartbeat();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [path]);
}

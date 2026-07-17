"use client";

import { useCallback, useEffect, useState } from "react";
import type { EngagementSummary } from "@/lib/engagement";

type EngagementState = EngagementSummary & {
  error: string | null;
  isLikePending: boolean;
};

export function useEventEngagement(slug: string, initialLikeCount: number, initialCommentCount: number) {
  const [state, setState] = useState<EngagementState>({
    likeCount: initialLikeCount,
    commentCount: initialCommentCount,
    viewerLiked: false,
    error: null,
    isLikePending: false,
  });
  useEffect(() => {
    const controller = new AbortController();
    void fetch(`/api/events/${encodeURIComponent(slug)}/engagement`, {
      signal: controller.signal,
      credentials: "same-origin",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Engagement tidak dapat dimuat");
        return response.json() as Promise<EngagementSummary>;
      })
      .then((summary) => {
        setState((current) => ({ ...current, ...summary, error: null }));
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState((current) => ({ ...current, error: "Jumlah interaksi belum dapat diperbarui." }));
      });
    return () => controller.abort();
  }, [slug]);

  const toggleLike = useCallback(async () => {
    const before = state;
    if (before.isLikePending) return;
    const nextLiked = !before.viewerLiked;
    setState((current) => ({
      ...current,
      viewerLiked: nextLiked,
      likeCount: Math.max(0, current.likeCount + (nextLiked ? 1 : -1)),
      isLikePending: true,
      error: null,
    }));

    try {
      const response = await fetch(`/api/events/${encodeURIComponent(slug)}/like`, {
        method: "PUT",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ liked: nextLiked }),
      });
      const result = (await response.json()) as { liked?: boolean; likeCount?: number; error?: string };
      if (!response.ok || typeof result.liked !== "boolean" || typeof result.likeCount !== "number") {
        throw new Error(result.error ?? "Like tidak dapat diperbarui");
      }
      setState((current) => ({
        ...current,
        viewerLiked: result.liked as boolean,
        likeCount: result.likeCount as number,
        isLikePending: false,
      }));
    } catch {
      setState((current) => ({
        ...current,
        viewerLiked: before.viewerLiked,
        likeCount: before.likeCount,
        isLikePending: false,
        error: "Like tidak dapat diperbarui. Silakan coba lagi.",
      }));
    }
  }, [slug, state]);

  const incrementCommentCount = useCallback(() => {
    setState((current) => ({ ...current, commentCount: current.commentCount + 1 }));
  }, []);

  return { ...state, toggleLike, incrementCommentCount };
}

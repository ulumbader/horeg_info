type AudioPreloadCandidate = {
  slug: string;
  audioStreamUrl: string | null;
};

export type AudioPreloadConnection = {
  saveData?: boolean;
  effectiveType?: string;
};

const SLOW_CONNECTION_TYPES = new Set(["slow-2g", "2g"]);

export function shouldPreloadAudio(connection?: AudioPreloadConnection): boolean {
  if (connection?.saveData) return false;
  return !connection?.effectiveType || !SLOW_CONNECTION_TYPES.has(connection.effectiveType);
}

export function getAudioPreloadUrls(
  events: readonly AudioPreloadCandidate[],
  prioritySlug?: string | null,
): string[] {
  const prioritized = prioritySlug
    ? [
        ...events.filter((event) => event.slug === prioritySlug),
        ...events.filter((event) => event.slug !== prioritySlug),
      ]
    : events;

  return [...new Set(
    prioritized
      .map((event) => event.audioStreamUrl)
      .filter((url): url is string => Boolean(url)),
  )];
}

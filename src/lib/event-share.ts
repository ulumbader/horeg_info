export interface EventShareTargets {
  whatsapp: string;
  facebook: string;
  x: string;
  telegram: string;
}

function createShareUrl(baseUrl: string, params: Record<string, string>) {
  const url = new URL(baseUrl);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return url.toString();
}

export function buildEventShareUrl(baseUrl: string, eventSlug: string) {
  const url = new URL("/", baseUrl);
  url.searchParams.set("event", eventSlug);
  return url.toString();
}

export function buildEventShareText(eventTitle: string) {
  return `Lihat detail acara ${eventTitle} di SOUND HOREG.INFO.`;
}

export function buildEventShareTargets(shareUrl: string, shareText: string): EventShareTargets {
  return {
    whatsapp: createShareUrl("https://wa.me/", {
      text: `${shareText}\n${shareUrl}`,
    }),
    facebook: createShareUrl("https://www.facebook.com/sharer/sharer.php", {
      u: shareUrl,
    }),
    x: createShareUrl("https://twitter.com/intent/tweet", {
      text: shareText,
      url: shareUrl,
    }),
    telegram: createShareUrl("https://t.me/share/url", {
      url: shareUrl,
      text: shareText,
    }),
  };
}

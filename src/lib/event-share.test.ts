import { describe, expect, it } from "vitest";
import {
  buildEventShareTargets,
  buildEventShareText,
  buildEventShareUrl,
} from "./event-share";

describe("event share", () => {
  it("builds a stable event URL without carrying dashboard filters", () => {
    expect(
      buildEventShareUrl(
        "https://soundhoreg.info/?status=past&panel=comments",
        "festival-horeg-malang",
      ),
    ).toBe("https://soundhoreg.info/?event=festival-horeg-malang");
  });

  it("builds an Indonesian share message with the product identity", () => {
    expect(buildEventShareText("Festival Horeg Malang")).toBe(
      "Lihat detail acara Festival Horeg Malang di SOUND HOREG.INFO.",
    );
  });

  it("encodes the event URL and message for supported share targets", () => {
    const shareUrl = "https://soundhoreg.info/?event=festival-horeg-malang";
    const shareText = buildEventShareText("Festival Horeg Malang");
    const targets = buildEventShareTargets(shareUrl, shareText);

    const whatsapp = new URL(targets.whatsapp);
    expect(whatsapp.origin).toBe("https://wa.me");
    expect(whatsapp.searchParams.get("text")).toBe(`${shareText}\n${shareUrl}`);

    const facebook = new URL(targets.facebook);
    expect(facebook.searchParams.get("u")).toBe(shareUrl);

    const x = new URL(targets.x);
    expect(x.searchParams.get("text")).toBe(shareText);
    expect(x.searchParams.get("url")).toBe(shareUrl);

    const telegram = new URL(targets.telegram);
    expect(telegram.searchParams.get("text")).toBe(shareText);
    expect(telegram.searchParams.get("url")).toBe(shareUrl);
  });
});

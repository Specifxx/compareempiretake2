"use client";
// Word of mouth (owner, 2026-11-02): the phone's own share sheet, else copy the link. No pop-up, no reward.
import { track } from "@vercel/analytics";
import { useState } from "react";
import { shareUrl, type ShareMedium } from "@/lib/share-link";
import { CheckIcon, ShareIcon } from "./icons";

export function ShareButton({
  title,
  path,
  text,
  medium = "product",
  label = "Share",
  className = "btn-ghost",
}: {
  title: string;
  path: string;
  text: string;
  medium?: ShareMedium;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const url = shareUrl(location.origin, path, medium);
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        track("share", { medium, how: "sheet" });
      } else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        track("share", { medium, how: "copy" });
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* cancelled or blocked: nothing to do */
    }
  };
  return (
    <button type="button" onClick={share} className={className} aria-live="polite">
      {copied ? <CheckIcon /> : <ShareIcon />} {copied ? "Link copied" : label}
    </button>
  );
}

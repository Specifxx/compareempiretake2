"use client";
// Word of mouth (owner, 2026-11-02): the phone's own share sheet, else copy the link. No pop-up.
// Share-for-a-deal (owner, 2026-11-18; ShareThanks.tsx): half of browsers see "Share · get a deal" and, after a share
// completes, a small card under the button pointing to their region's deals. share { medium, arm } (Vercel keeps two
// properties, so the arm replaced the sheet/copy split), share_unlock { medium }.
import { track } from "@vercel/analytics";
import { useState } from "react";
import { shareUrl, type ShareMedium } from "@/lib/share-link";
import { CheckIcon, ShareIcon } from "./icons";
import { ShareThanks, useShareArm } from "./ShareThanks";

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
  const arm = useShareArm();
  const [thanks, setThanks] = useState(false);
  const unlock = () => {
    if (arm !== "reward") return;
    setThanks(true);
    try {
      track("share_unlock", { medium });
    } catch {}
  };
  const seg = path.split("/")[1];
  const deals = ["us", "uk", "ca", "sg"].includes(seg) ? `/${seg}/deals` : "/deals";
  const share = async () => {
    const url = shareUrl(location.origin, path, medium);
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        track("share", { medium, arm });
        unlock();
      } else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        track("share", { medium, arm });
        setCopied(true);
        unlock();
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* cancelled or blocked: nothing to do */
    }
  };
  return (
    <span className="relative inline-flex">
      <button type="button" onClick={share} className={className} aria-live="polite">
        {copied ? <CheckIcon /> : <ShareIcon />} {copied ? "Link copied" : arm === "reward" ? "Share · get a deal" : label}
      </button>
      {thanks && <ShareThanks href={deals} line="Today’s products selling under their usual price at stores in your region, checked every day." onClose={() => setThanks(false)} />}
    </span>
  );
}

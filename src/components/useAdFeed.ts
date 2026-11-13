"use client";

import { useEffect, useState } from "react";
import { useRegion } from "@/lib/use-region";
import type { Rails } from "@/lib/side-rails";

// The ad tiles for the visitor's region: the static /rails/<region> file (lib/side-rails.ts), fetched once per region in the browser.
// Used by the in-page ad block (InlineAds.tsx) and the phone dock (PhoneDock.tsx); never in the server HTML.
const loaded = new Map<string, Promise<Rails | null>>();
function load(region: string): Promise<Rails | null> {
  let p = loaded.get(region);
  if (!p) {
    p = fetch(`/rails/${region}`)
      .then((r) => (r.ok ? (r.json() as Promise<Rails>) : null))
      .catch(() => null);
    loaded.set(region, p);
  }
  return p;
}

/** `undefined` while loading, `null` when there is nothing to show. */
export function useAdFeed(enabled = true): Rails | null | undefined {
  const region = useRegion();
  const [rails, setRails] = useState<Rails | null | undefined>(undefined);
  useEffect(() => {
    if (!enabled) return;
    let live = true;
    load(region).then((r) => live && setRails(r));
    return () => {
      live = false;
    };
  }, [region, enabled]);
  if (!enabled) return undefined;
  return rails === undefined || rails === null ? rails : rails.region === region ? rails : undefined;
}

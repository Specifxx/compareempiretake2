/** Listings we never compare: second-hand, carrier-locked, or not a phone. */
const EXCLUDE =
  /\b(refurb\w*|renewed|pre-?owned|as new|ex-?demo|demo unit|telstra|optus|vodafone|boost|aldi|locked|cases?|covers?|folio|screen protector|protectors?|chargers?|cables?|watch\w*|tab|tablets?|buds\d?|earbuds|bands?|ipad|book|power ?bank|stylus|mounts?|holders?|sim card|starter kit|prepaid|wallet|skin|glass|lens|strap)\b|\b(Opt|Tel)\s*\)|\bFor (TEL|Opt)\b|damage/i;

export function looksLikePhone(title: string): boolean {
  if (EXCLUDE.test(title)) return false;
  return /\d+\s?(GB|TB)\b/i.test(title);
}

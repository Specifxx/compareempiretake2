/** Colour words store titles use. Shared by the phone parser (normalize.ts) and the other categories' (match-more.ts). */
export const COLOURS =
  "black white silver grey gray blue red green pink purple gold rose midnight starlight graphite navy cream sand beige natural jet space slate ink plum lavender mint coral orange yellow teal sage blush cobalt onyx arctic sky light dark deep matte platinum champagne bronze copper charcoal stone moss olive ivory pearl peach smoke frost ash cloud ocean desert storm phantom carbon lilac violet lime ruby burgundy espresso mocha".split(
    " ",
  );
export const COLOUR_WORD = new Set(COLOURS);

import type { CategoryId } from "./types";

/**
 * A short buying guide per category: what actually matters when choosing, and the questions people
 * ask before buying. Shown on category pages and as the "Buying tips" block on product pages.
 * Written to be true everywhere we compare prices (AU, US, UK); no prices or claims about stores.
 */
export interface CategoryGuide { tips: string[]; faq: [string, string][] }

export const CATEGORY_GUIDES: Partial<Record<CategoryId, CategoryGuide>> = {
  phones: {
    tips: [
      "Buy the storage you'll need in three years: you can't add it later, and photos and apps only grow. 256GB is the sweet spot for most people.",
      "Last year's flagship often beats this year's mid-range on camera and screen, and drops the most in price once its replacement launches.",
      "Check software support: Apple, Google and Samsung now promise around seven years of updates on recent models, which matters more than a spec bump.",
    ],
    faq: [
      ["Is it cheaper to buy a phone outright or on a plan?", "Usually outright plus a SIM-only plan. A plan spreads the phone's cost over 24 or 36 months, often at or above the outright price, and ties you to that carrier."],
      ["Should I wait for a sale?", "Prices often fall shortly after a successor launches and around major sales events. The price history on each phone page shows whether today's price is actually low."],
    ],
  },
  tablets: {
    tips: [
      "Decide Wi-Fi or cellular first: cellular models cost more and need a data plan, but you can't add it later.",
      "For note-taking and drawing, check which stylus the tablet supports before you buy; they're rarely interchangeable between generations.",
    ],
    faq: [
      ["How much storage does a tablet need?", "128GB suits streaming, browsing and notes. Choose more if you download video for travel, edit photos or store large games."],
      ["Is a tablet a laptop replacement?", "For email, browsing and documents with a keyboard case, often yes. For specialist desktop software, multiple windows or heavy multitasking, a laptop is still easier."],
    ],
  },
  laptops: {
    tips: [
      "16GB of memory is the realistic minimum for a laptop you'll keep for years; it usually can't be upgraded later on thin models.",
      "An SSD of 512GB or more saves you from juggling space. Battery life claims vary widely by test, so compare reviews, not the box.",
      "Model names hide very different configurations: compare the exact processor, memory and storage, not just the series.",
    ],
    faq: [
      ["What specs matter most for students?", "Battery life, weight and 16GB of memory. Unless the course needs a dedicated graphics card, an efficient chip will feel faster for longer."],
      ["Is a gaming laptop good for everyday use?", "It works, but it's heavier and the battery lasts less. If gaming is occasional, a lighter laptop plus a console or cloud gaming can be the better value."],
    ],
  },
  desktops: {
    tips: [
      "Check what's upgradable: a desktop with a standard power supply and free slots lasts years longer than a sealed mini PC.",
      "Prebuilt gaming PCs are priced around their graphics card; compare the exact GPU model first, then the processor.",
    ],
    faq: [["Is a mini PC powerful enough?", "For office work, browsing and media, yes. For gaming or video editing, look for a dedicated graphics card or a desktop with room for one."]],
  },
  monitors: {
    tips: [
      "Match resolution to size: 1440p suits 27 inches, 4K makes sense from 27 to 32 inches, and 1080p is best kept to 24 inches or smaller.",
      "For gaming, refresh rate (144Hz or more) and response time matter; for work, a USB-C port that charges your laptop can replace a dock.",
      "OLED monitors have the best contrast but can be dearer and are best for mixed use; check the burn-in warranty.",
    ],
    faq: [["Is 4K worth it for gaming?", "Only with a powerful graphics card. Many players get a better experience from 1440p at a high refresh rate."]],
  },
  "graphics-cards": {
    tips: [
      "The chip (for example RTX 5070 or RX 9070) sets performance; brands differ mainly in cooling, noise and size, usually within a few percent.",
      "Check your case length and power supply before buying: big cards need space and the right power connectors.",
      "Video memory matters at high resolutions: 12GB or more is safer for 1440p and 4K in new games.",
    ],
    faq: [["Should I buy a new or used graphics card?", "Used cards can be cheap, but check warranty transfer and avoid ex-mining cards with no history. New gives you the full warranty."]],
  },
  cpus: {
    tips: ["Pick the platform first: the processor, motherboard socket and memory type (DDR4 or DDR5) must match.", "For gaming, a mid-range chip with a large cache often matches the flagship; spend the difference on the graphics card."],
    faq: [["Does a processor come with a cooler?", "Some do and many high-end models don't. Check the listing; budget for a cooler if it says 'no cooler included'."]],
  },
  ssds: {
    tips: ["NVMe drives are several times faster than SATA, but only if your board has an M.2 slot that supports NVMe.", "For a games drive, capacity matters more than top speed; 2TB is the sweet spot for price per gigabyte."],
    faq: [["Do I need a heatsink for an NVMe SSD?", "Fast PCIe 4.0 and 5.0 drives can throttle without one. Many motherboards include an M.2 heatsink; PS5 owners need one."]],
  },
  ram: {
    tips: ["Buy memory in a matched kit (2 × 16GB rather than two single sticks) for the best stability.", "Check your motherboard's supported speeds; very fast kits often need a manual profile (XMP or EXPO) turned on."],
    faq: [["How much RAM do I need?", "16GB for everyday use and most games, 32GB for heavy multitasking, streaming or editing, and more for professional workloads."]],
  },
  motherboards: {
    tips: ["Choose the chipset for the features you'll use: overclocking, PCIe 5.0 and the number of M.2 slots differ more than raw speed.", "Check rear USB ports and built-in Wi-Fi; adding them later costs extra."],
    faq: [["Will this board fit my case?", "Match the form factor: ATX boards need a mid tower or larger, micro-ATX and mini-ITX fit smaller cases."]],
  },
  tvs: {
    tips: [
      "OLED gives perfect blacks and is best in dim rooms; Mini LED gets brighter and suits bright living rooms.",
      "For gaming on a recent console, look for HDMI 2.1 with 4K at 120Hz and variable refresh rate (VRR).",
      "Size by distance: for 4K, a screen around 1 to 1.5 times its diagonal away looks sharp without being overwhelming.",
    ],
    faq: [
      ["When do TVs get cheaper?", "New models usually launch in spring, so last year's range is often cheapest in the months that follow and during big sales events."],
      ["Do I need a soundbar?", "Thin TVs have small speakers. Even an entry-level soundbar usually makes dialogue much clearer."],
    ],
  },
  soundbars: {
    tips: ["A separate subwoofer adds real bass; Dolby Atmos needs up-firing speakers or rear speakers to sound like more than stereo.", "Connect through HDMI eARC if your TV has it, so the TV remote controls the volume and you get full-quality sound."],
    faq: [["Is Dolby Atmos worth it?", "With up-firing or rear speakers and Atmos content, yes. A cheap 'virtual Atmos' bar often sounds similar to a good stereo bar."]],
  },
  headphones: {
    tips: [
      "Noise cancelling matters most for flights, commuting and open offices; comfort over hours matters more than a small difference in sound.",
      "Check codec support for your phone (for example AAC for iPhone, LDAC on many Android phones) if sound quality is the priority.",
      "Older flagship models often drop sharply in price when the new version launches and still sound excellent.",
    ],
    faq: [
      ["Over-ear or earbuds?", "Over-ear usually wins on comfort, battery and noise cancelling; earbuds win on portability and exercise."],
      ["Are expensive headphones worth it?", "Up to a point. Past the mid-range, gains are smaller; fit and noise cancelling quality matter more than price."],
    ],
  },
  speakers: {
    tips: ["Water resistance (IP67) matters for outdoor and beach use; battery life claims are usually measured at moderate volume.", "For home use, a Wi-Fi speaker works better than Bluetooth for multi-room audio and doesn't drop out when your phone leaves the room."],
    faq: [["Can I pair two speakers for stereo?", "Usually only with two of the same brand, and often the same range. Check the brand's app or party-mode support."]],
  },
  smartwatches: {
    tips: ["Pick the platform that matches your phone: Apple Watch works only with iPhone; Wear OS and Garmin work with both.", "For running and hiking, battery life and GPS accuracy matter more than apps; multi-band GPS is the upgrade to look for."],
    faq: [["Do I need the cellular version?", "Only if you want calls, messages or streaming without your phone nearby. It costs more and needs a plan with your carrier."]],
  },
  consoles: {
    tips: ["Digital editions are cheaper up front, but you can't buy or sell used physical games.", "Check storage: large modern games fill a base console quickly, and expansion drives add to the real price."],
    faq: [["Do consoles go on sale?", "Mostly in bundles around major sales events. Compare the console-only price with bundles to see what the extras are really worth."]],
  },
  cameras: {
    tips: ["The lens system matters more than the body: choose the brand whose lenses you'll want in two years.", "Body-only and kit prices differ by the lens; a better lens bought separately is often a smarter buy than the cheapest kit."],
    faq: [["Is a phone good enough instead of a camera?", "For everyday photos, often yes. A dedicated camera wins on zoom, low light, fast action and interchangeable lenses."]],
  },
  drones: {
    tips: ["Check local rules before you fly: most countries require registration or limit where and how high you can fly.", "A 'Fly More' kit with extra batteries is usually cheaper than buying batteries later, and flight time per battery is short."],
    faq: [["Which drone needs no registration?", "Rules vary by country and weight (often under 250 g is treated more lightly). Always check your aviation authority's current rules."]],
  },
  "robot-vacuums": {
    tips: ["Self-emptying docks save the most effort; mopping docks that wash and dry the pads are worth it if you have hard floors.", "LiDAR navigation maps the home more reliably than camera-only models, especially in low light."],
    faq: [["Do robot vacuums work on carpet?", "Yes, on low and medium pile. Look for strong suction and automatic carpet boost; mops should lift on carpet."]],
  },
  vacuums: {
    tips: [
      "Run time claims are on the lowest power setting; on carpet boost most cordless sticks last 10 to 20 minutes, so a model with a swappable battery suits larger homes.",
      "Many models come in several bundles (extra tools, a second battery, a self-empty base) under one name: compare the exact model code, not just the series.",
    ],
    faq: [
      ["Cordless stick or barrel vacuum?", "A cordless stick is easier for quick, daily cleans and stairs. A corded barrel still wins on suction, run time and price for big homes with lots of carpet."],
      ["Is a Dyson worth it over Shark or Samsung?", "Not automatically. Compare suction, run time and the battery's replacement cost; older Dyson models often drop to well under the newest Shark's price."],
    ],
  },
  lego: {
    tips: [
      "Search by the set number on the box (five digits, like 75447): every store prints it, and it is how this page matches the same set across stores.",
      "LEGO's own recommended price is the ceiling, not the norm: toy stores often run 20–40% off popular sets, and big sets drop most around Black Friday and Boxing Day.",
      "Sets retire after two or three years and then rise in price, so a set you want that has been on shelves a while is worth buying before it goes.",
    ],
    faq: [
      ["Is LEGO cheaper on eBay?", "Sometimes, for new sealed sets from Australian sellers, especially right after a sale ends. We only show new, Buy It Now listings from sellers in Australia, with postage included."],
      ["Do Australian prices differ from overseas?", "Yes. Prices here are in Australian dollars from Australian stores; an overseas price usually adds postage and can add GST."],
    ],
  },
  "air-fryers": {
    tips: [
      "Size it to your household: about 3–4L cooks for one or two, 5–7L for a family, and a dual-zone model cooks a main and a side at the same time.",
      "Basket air fryers crisp faster; oven-style models fit more and can rotisserie, but take more bench space.",
    ],
    faq: [["Do air fryers use less power than an oven?", "Usually, for small loads: they heat a much smaller space and cook faster. For a full tray of food an oven can be just as efficient."]],
  },
  "coffee-machines": {
    tips: [
      "Decide how hands-on you want to be: pod machines are fastest, fully automatic machines grind and froth at a button, and manual espresso machines give the best coffee for the price if you'll learn the steps.",
      "A built-in grinder saves buying one separately (budget A$150 or more for a decent standalone grinder).",
      "The same machine often has a different model code per colour, and stores discount colours differently: check every colour's price.",
    ],
    faq: [
      ["Are pod machines cheaper?", "Cheaper to buy, dearer to run: pods cost far more per cup than beans. Over a few years a bean machine usually costs less in total."],
      ["When do coffee machines go on sale?", "Often around Black Friday, Christmas and end-of-financial-year sales. The price history on each machine's page shows whether today's price is really low."],
    ],
  },
  fridges: {
    tips: [
      "Measure the space, then leave the gap the manual asks for at the sides and top: a fridge without air around it works harder and costs more to run.",
      "Compare the energy star rating and the kWh per year on the label; over ten years running costs can exceed the price difference between two fridges.",
      "Plumbed ice and water needs a water tap behind the fridge; non-plumbed models have a tank you refill.",
    ],
    faq: [
      ["What size fridge do I need?", "As a rough guide, about 100L per person plus 100L: 300–400L suits a couple, 450–600L a family of four or five."],
      ["Does delivery and removal cost extra?", "It depends on the store and your postcode. Check delivery, installation and old-fridge removal at checkout before comparing two prices."],
    ],
  },
  "washing-machines": {
    tips: [
      "Front loaders use less water and power and are gentler on clothes; top loaders wash faster and are easier on the back.",
      "Pick the capacity for your biggest regular load: 7.5–8kg suits most couples, 9–10kg a family, and bigger drums wash doonas at home.",
      "A heat pump dryer costs more up front but uses far less power than a vented dryer; it pays off if you dry often.",
    ],
    faq: [["Is a washer-dryer combo a good idea?", "It saves space, but dries only about half a wash load at a time and slowly. If you have room, a separate washer and dryer is more flexible."]],
  },
  dishwashers: {
    tips: [
      "Standard dishwashers are 60cm wide; check whether you need freestanding, built-under or fully integrated (a cabinet door covers the front) before you compare.",
      "Look at noise (dB) if your kitchen is open-plan, and at the water star rating for running costs.",
    ],
    faq: [["How many place settings do I need?", "12 to 15 place settings suits most families. A 45cm slimline or benchtop model fits small kitchens and one or two people."]],
  },
  routers: {
    tips: ["Mesh systems beat a single powerful router in larger or multi-storey homes.", "Wi-Fi 7 helps only if your devices support it; Wi-Fi 6E or 6 is still excellent value for most homes."],
    faq: [["Do I need a new modem too?", "It depends on your connection type. Many providers supply a modem; a new router or mesh can connect to it."]],
  },
  printers: {
    tips: ["Ink tank printers cost more up front and far less per page; cartridge printers suit people who rarely print.", "For documents only, a mono laser is fast, cheap to run and doesn't dry out."],
    faq: [["Why are some printers so cheap?", "Cheap cartridge printers are often subsidised by ink sales. Check the price of replacement cartridges before you buy."]],
  },
};

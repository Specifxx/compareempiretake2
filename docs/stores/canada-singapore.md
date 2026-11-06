# Canada and Singapore stores (2026-11-06)

Both regions went in on 2026-11-06 (owner: "expand Compare Empire to Canada and Singapore … cover as many stores as
possible"). A region's pages stay a 404 until it has products (`regionLive`), so the regions switch on with their first
import. Stores were found by survey rounds 22 and 22b (`docs/stores/candidates22-ca.txt`, `candidates22-sg.txt`,
`candidates22b.txt`, read from GitHub by `probe-stores.yml`), and each one keeps only the categories of its own trade.

## Read directly (one-line `autoShopify` stores)

Canada (21): Shokz, soundcore, Roborock, Narwal, Dreame, Sennheiser, HyperX, Ooni (brand stores); The Camera Store,
Gosselin (cameras, drones; Gosselin's used stock "USAGÉ" refused); Audio Excellence; iDrinkCoffee, Eight Ounce Coffee
(its yard-sale and cosmetic-defect stock refused), Espresso Planet, Anthony's Espresso, Consiglio's Kitchenware, Home
Coffee Solutions, Coffee Addicts, Espresso Dolce; Appliance Canada (one copy of each listing: its ZAA stock code); Mastermind Toys (LEGO only).

Singapore (17): Challenger (the country's largest electronics chain, read whole), Mega Discount Store (appliances, TVs;
its air purifiers, water heaters, wine chillers and shavers refused), Stereo, Mobile Square, Gadget Box, Sony Store
(pre-order, notify-me and special-order lines refused), MS Color, The Tech Yard (PC parts), Gameshop, Common Man Coffee
Roasters; brand stores Mayer, Toyomi, Tefal, Europace, Shokz, Sennheiser, Narwal.

## Feed slots (live once the owner's network approval saves a `FEED_URL_*` secret)

Canada: Best Buy, Walmart, Staples, Canadian Tire, Newegg, London Drugs, Visions, Costco, The Home Depot, The Brick,
Leon's. Singapore: COURTS, Harvey Norman, Best Denki, Gain City. The owner's Chrome prompt is
`/mnt/project-files/compare-empire/chrome-prompt-canada-singapore-affiliates.md` (project files).

## Left out, and why

- Leon's and The Brick, read directly: every product is repeated once per store location, and both list marketplace
  sellers (Aosom, Luxe Décor). Their feeds only.
- sg.roborock.com charges USD. sg.eufy.com, ca.anker.com, ca.minisforum.com, Rocanini, Aerogaz: too few products in
  our categories. Faema Canada: mostly machine parts.
- Mister Mobile: its catalogue files phones and parts under the wrong categories in the survey; not added on a guess.
- Restaurant supply (Stop Restaurant Supply), school and toy stores without LEGO (Scholar's Choice, Toysense), Video
  Games Plus: nothing of ours.
- Lazada, Shopee, Amazon.sg and every marketplace: we list stores, not marketplaces.

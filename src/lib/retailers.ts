import type { Retailer, RetailerId } from "./types";

export const RETAILERS: Record<RetailerId, Retailer> = {
  jbhifi: { id: "jbhifi", name: "JB Hi-Fi", site: "jbhifi.com.au", color: "#FFD600", type: "retailer" },
  harveynorman: { id: "harveynorman", name: "Harvey Norman", site: "harveynorman.com.au", color: "#005B9C", type: "retailer" },
  thegoodguys: { id: "thegoodguys", name: "The Good Guys", site: "thegoodguys.com.au", color: "#E4002B", type: "retailer" },
  mobileciti: { id: "mobileciti", name: "Mobileciti", site: "mobileciti.com.au", color: "#0BA360", type: "retailer" },
  apple: { id: "apple", name: "Apple Store", site: "apple.com/au", color: "#1D1D1F", type: "official" },
  samsung: { id: "samsung", name: "Samsung Store", site: "samsung.com/au", color: "#1428A0", type: "official" },
  telstra: { id: "telstra", name: "Telstra", site: "telstra.com.au", color: "#0064D2", type: "carrier" },
  optus: { id: "optus", name: "Optus", site: "optus.com.au", color: "#00A79D", type: "carrier" },
  vodafone: { id: "vodafone", name: "Vodafone", site: "vodafone.com.au", color: "#E60000", type: "carrier" },
  amaysim: { id: "amaysim", name: "amaysim", site: "amaysim.com.au", color: "#FF6B00", type: "carrier" },
  telechoice: { id: "telechoice", name: "TeleChoice", site: "telechoice.com.au", color: "#7B2D8E", type: "retailer" },
  costco: { id: "costco", name: "Costco", site: "costco.com.au", color: "#005DAA", type: "retailer" },
  umart: { id: "umart", name: "Umart", site: "umart.com.au", color: "#F7941D", type: "retailer" },
  msy: { id: "msy", name: "MSY", site: "msy.com.au", color: "#C8102E", type: "retailer" },
  digidirect: { id: "digidirect", name: "digiDirect", site: "digidirect.com.au", color: "#111111", type: "retailer" },
  betta: { id: "betta", name: "Betta", site: "betta.com.au", color: "#E31837", type: "retailer" },
  mwave: { id: "mwave", name: "Mwave", site: "mwave.com.au", color: "#00AEEF", type: "retailer" },
};

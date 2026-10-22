import type { Retailer, RetailerId } from "./types";

export const RETAILERS: Record<RetailerId, Retailer> = {
  jbhifi: { id: "jbhifi", name: "JB Hi-Fi", site: "jbhifi.com.au", color: "#FFD600" },
  harveynorman: { id: "harveynorman", name: "Harvey Norman", site: "harveynorman.com.au", color: "#005B9C" },
  thegoodguys: { id: "thegoodguys", name: "The Good Guys", site: "thegoodguys.com.au", color: "#E4002B" },
  mobileciti: { id: "mobileciti", name: "Mobileciti", site: "mobileciti.com.au", color: "#0BA360" },
};

import "server-only";
import { createHash, randomBytes } from "node:crypto";

/** A one-way hash of the visitor's IP, only used to rate-limit submissions. */
export function ipHash(req: Request): string {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  return createHash("sha256").update(`${ip}|${process.env.ADMIN_PASSWORD ?? "ce"}`).digest("hex").slice(0, 32);
}

export const token = () => randomBytes(24).toString("base64url");

export const isEmail = (s: unknown): s is string => typeof s === "string" && s.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

export const clip = (s: unknown, n: number) => (typeof s === "string" ? s.trim().slice(0, n) : "");

export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "cache-control": "no-store" } });
}

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { connection } from "next/server";

function sign(value) {
  const key = `${process.env.SESSION_SECRET}:${process.env.CLASS_CODE}`;
  return createHmac("sha256", key).update(value).digest("hex");
}

export function makeToken(role) {
  const expires = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
  const payload = `${role}.${expires}`;
  return `${payload}.${sign(payload)}`;
}

// Returns "admin", "student", or null
export function verifyToken(token) {
  if (!token) return null;
  const [role, expires, signature] = token.split(".");
  if (!role || !expires || !signature) return null;

  const a = Buffer.from(signature);
  const b = Buffer.from(sign(`${role}.${expires}`));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  if (Number(expires) < Date.now()) return null;
  return role;
}

export async function getRole() {
  await connection(); // always run at request time, never at build time
  const store = await cookies();
  return verifyToken(store.get("session")?.value);
}
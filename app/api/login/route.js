import { cookies } from "next/headers";
import { makeToken } from "../../../lib/session";

export async function POST(request) {
  const body = await request.json();
  const code = (body.code || "").trim();

  let role = null;
  if (code && code === process.env.UPLOAD_PASSWORD) role = "admin";
  else if (code && code === process.env.CLASS_CODE) role = "student";

  if (!role) {
    return Response.json({ error: "Wrong code" }, { status: 401 });
  }

  const store = await cookies();
  store.set("session", makeToken(role), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  return Response.json({ role });
}

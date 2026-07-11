import { NextResponse } from "next/server";
import { AUTH_COOKIE, AUTH_MAX_AGE, dashboardPassword, dashboardToken } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const pin = typeof body?.pin === "string" ? body.pin : "";
  if (pin !== dashboardPassword()) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const proto =
    req.headers.get("x-forwarded-proto") ?? new URL(req.url).protocol.replace(":", "");
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, await dashboardToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: proto === "https",
    path: "/",
    maxAge: AUTH_MAX_AGE,
  });
  return res;
}

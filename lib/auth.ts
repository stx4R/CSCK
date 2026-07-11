export const AUTH_COOKIE = "moguk_dash_auth";
export const AUTH_MAX_AGE = 60 * 60 * 8;

export function dashboardPassword(): string {
  return process.env.DASHBOARD_PASSWORD || "031649";
}

export async function dashboardToken(): Promise<string> {
  const data = new TextEncoder().encode(`moguk-dash-v1:${dashboardPassword()}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

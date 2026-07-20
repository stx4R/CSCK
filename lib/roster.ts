import type { User } from "./types";

function parseRoster(): User[] {
  const raw = process.env.NEXT_PUBLIC_ROSTER_JSON;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as User[]) : [];
  } catch {
    return [];
  }
}

export const ROSTER: User[] = parseRoster();

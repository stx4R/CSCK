import { supabase } from "./supabase";
import { ROSTER } from "./roster";
import type { AttendanceRecord, NewRecord, User } from "./types";

const LS_KEY = "moguk_attendance_records";

export async function fetchUsers(): Promise<User[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from("users")
      .select("id,name,phone,digits,school,role")
      .order("id");
    if (!error && data && data.length > 0) return data as User[];
  }
  return ROSTER;
}

function readLocal(): AttendanceRecord[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as AttendanceRecord[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(records: AttendanceRecord[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(records));
  } catch {}
}

export async function fetchRecords(): Promise<AttendanceRecord[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from("attendance")
      .select("*")
      .order("checked_at", { ascending: true })
      .order("id", { ascending: true });
    if (!error && data) return data as AttendanceRecord[];
    return [];
  }
  return readLocal();
}

export type InsertResult = "ok" | "duplicate" | "error";

export async function insertRecord(rec: NewRecord): Promise<InsertResult> {
  if (supabase) {
    const { error } = await supabase.from("attendance").insert(rec);
    if (!error) return "ok";
    return error.code === "23505" ? "duplicate" : "error";
  }
  const records = readLocal();
  if (
    !rec.forced &&
    rec.user_id != null &&
    records.some((r) => !r.forced && r.user_id === rec.user_id)
  ) {
    return "duplicate";
  }
  records.push({ ...rec, id: Date.now(), checked_at: new Date().toISOString() });
  writeLocal(records);
  return "ok";
}

export async function clearRecords(): Promise<boolean> {
  if (supabase) {
    await supabase.from("attendance").delete().gte("id", 0);
    const rest = await fetchRecords();
    return rest.length === 0;
  }
  writeLocal([]);
  return true;
}

export function subscribeRecords(onChange: () => void): () => void {
  if (supabase) {
    const sb = supabase;
    const channel = sb
      .channel("attendance-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "attendance" },
        () => onChange()
      )
      .subscribe();
    const poll = setInterval(onChange, 5000);
    return () => {
      clearInterval(poll);
      sb.removeChannel(channel);
    };
  }
  const onStorage = (e: StorageEvent) => {
    if (e.key === LS_KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  const poll = setInterval(onChange, 2000);
  return () => {
    window.removeEventListener("storage", onStorage);
    clearInterval(poll);
  };
}

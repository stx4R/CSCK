"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchRecords, fetchUsers, subscribeRecords } from "./attendance";
import type { AttendanceRecord, User } from "./types";

export function useAttendance() {
  const [users, setUsers] = useState<User[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const sigRef = useRef("");

  const refresh = useCallback(async () => {
    const recs = await fetchRecords();
    const sig = JSON.stringify(recs);
    if (sig !== sigRef.current) {
      sigRef.current = sig;
      setRecords(recs);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    fetchUsers().then((u) => {
      if (alive) setUsers(u);
    });
    refresh();
    const unsubscribe = subscribeRecords(refresh);
    const onWake = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onWake);
    window.addEventListener("focus", onWake);
    window.addEventListener("online", onWake);
    return () => {
      alive = false;
      unsubscribe();
      document.removeEventListener("visibilitychange", onWake);
      window.removeEventListener("focus", onWake);
      window.removeEventListener("online", onWake);
    };
  }, [refresh]);

  return { users, records, refresh };
}

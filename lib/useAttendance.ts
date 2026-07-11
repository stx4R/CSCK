"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchRecords, fetchUsers, subscribeRecords } from "./attendance";
import type { AttendanceRecord, User } from "./types";

/** 명단 + 출석 기록을 로드하고 실시간(또는 폴링)으로 갱신하는 훅 */
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
    // 화면 복귀·네트워크 복구 시 즉시 동기화
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

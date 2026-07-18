"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { clearRecords } from "@/lib/attendance";
import { useAttendance } from "@/lib/useAttendance";
import type { User } from "@/lib/types";

const CATEGORIES = [
  { id: "all", label: "All", school: null },
  { id: "dshs", label: "DSHS", school: "대신고" },
  { id: "dbhs", label: "DBHS", school: "동방고" },
  { id: "dflhs", label: "DFLHS", school: "대전외고" },
  { id: "force", label: "Force", school: null },
] as const;

type CategoryId = (typeof CATEGORIES)[number]["id"];

export default function Dashboard() {
  const { users, records, refresh } = useAttendance();
  const [category, setCategory] = useState<CategoryId>("all");

  const normalCheckedIds = useMemo(() => {
    const s = new Set<number>();
    records.forEach((r) => {
      if (!r.forced && r.user_id != null) s.add(r.user_id);
    });
    return s;
  }, [records]);

  const normalCheckedNames = useMemo(() => {
    const s = new Set<string>();
    records.forEach((r) => {
      if (!r.forced && r.name) s.add(r.name);
    });
    return s;
  }, [records]);

  const forcedNames = useMemo(() => {
    const s = new Set<string>();
    records.forEach((r) => {
      if (r.forced && r.name) s.add(r.name);
    });
    return s;
  }, [records]);

  const forcedRecords = useMemo(() => records.filter((r) => r.forced), [records]);

  const peopleOf = (school: string | null) =>
    school === null ? users : users.filter((u) => u.school === school);

  const statusOf = (u: User): "gray" | "green" | "red" => {
    if (!normalCheckedIds.has(u.id)) return "gray";
    return forcedNames.has(u.name) ? "red" : "green";
  };

  const active = CATEGORIES.find((c) => c.id === category)!;

  const clearAll = async () => {
    if (!window.confirm("모든 출석체크 기록을 삭제할까요?")) return;
    const cleared = await clearRecords();
    refresh();
    if (!cleared) {
      window.alert(
        "기록을 모두 삭제하지 못했습니다.\nSupabase에서는 익명 키로 삭제가 막혀 있습니다 — schema.sql의 'anon can delete attendance' 정책 주석을 해제하거나, Supabase 대시보드에서 직접 삭제해주세요."
      );
    }
  };

  return (
    <div className="screen" data-screen-label="관리자 대시보드">
      <header className="app-header">
        <div className="header-left">
          <img src="/moguk_logo.svg" alt="MoGuk" style={{ height: 28, width: "auto" }} />
          <span className="header-title">관리자 대시보드</span>
          <span className="header-caption">제3회 오량모의국회 출석 현황</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button className="pill-danger" onClick={clearAll}>
            기록 초기화
          </button>
          <Link href="/" className="pill-link">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M8 2.5L4 6L8 9.5" stroke="#0066cc" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            출석체크로 돌아가기
          </Link>
        </div>
      </header>

      <main className="dash-main">
        <div className="cat-bar">
          <div className="cat-tabs">
            {CATEGORIES.map((c) => {
              const isForce = c.id === "force";
              const people = peopleOf(c.school);
              const done = isForce
                ? forcedRecords.length
                : people.filter((u) => normalCheckedIds.has(u.id)).length;
              const total = isForce ? null : people.length;
              return (
                <button
                  key={c.id}
                  className={"cat-tab" + (category === c.id ? " selected" : "")}
                  onClick={() => setCategory(c.id)}
                >
                  <span className="cat-tab-label">{c.label}</span>
                  <span className="cat-tab-count">
                    {total === null ? done : done + " / " + total}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="legend">
            <span className="legend-item">
              <span className="legend-dot gray" />
              미출석
            </span>
            <span className="legend-item">
              <span className="legend-dot green" />
              출석 완료
            </span>
            <span className="legend-item">
              <span className="legend-dot red" />
              이름 중복
            </span>
          </div>
        </div>

        <div className="grid-panel">
          {category === "force" ? (
            forcedRecords.length === 0 ? (
              <div className="grid-empty">
                <span>강제 출석체크 기록이 없습니다.</span>
                <span className="grid-empty-sub">강제 출석체크가 진행되면 이곳에 표시됩니다.</span>
              </div>
            ) : (
              <div className="name-grid">
                {forcedRecords.map((r) => (
                  <div
                    key={r.id}
                    className={"grid-chip " + (normalCheckedNames.has(r.name) ? "red" : "amber")}
                  >
                    {r.name || "(이름 미입력)"}
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="name-grid">
              {peopleOf(active.school).map((u) => (
                <div key={u.id} className={"grid-chip " + statusOf(u)}>
                  {u.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

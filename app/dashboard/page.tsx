"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { clearRecords } from "@/lib/attendance";
import { useAttendance } from "@/lib/useAttendance";
import { roleColor, schoolColor } from "@/lib/colors";

const FILTER_DEFS = [
  { id: "all", label: "전체" },
  { id: "normal", label: "정상" },
  { id: "forced", label: "강제" },
] as const;

type FilterId = (typeof FILTER_DEFS)[number]["id"];

const PASSWORD = process.env.NEXT_PUBLIC_DASHBOARD_PASSWORD || "031649";
const PIN_LENGTH = PASSWORD.length;
const KEY_DEFS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

export default function DashboardPage() {
  const [unlocked, setUnlocked] = useState(false);
  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />;
  return <Dashboard />;
}

function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);

  const press = (k: string) => {
    if (shake || k === "") return;
    if (k === "del") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    setPin((p) => {
      if (p.length >= PIN_LENGTH) return p;
      const next = p + k;
      if (next.length === PIN_LENGTH) {
        if (next === PASSWORD) {
          onUnlock();
        } else {
          setShake(true);
          setTimeout(() => {
            setShake(false);
            setPin("");
          }, 500);
        }
      }
      return next;
    });
  };

  return (
    <div className="screen" data-screen-label="대시보드 비밀번호">
      <header className="app-header">
        <div className="header-left">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/moguk_logo.svg" alt="MoGuk" style={{ height: 28, width: "auto" }} />
          <span className="header-title">관리자 대시보드</span>
          <span className="header-caption">제3회 전국모의국회 출석 현황</span>
        </div>
        <Link href="/" className="pill-link">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M8 2.5L4 6L8 9.5" stroke="#0066cc" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          출석체크로 돌아가기
        </Link>
      </header>

      <main className="gate-main">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
            <rect x="7" y="14.5" width="20" height="14" rx="4" stroke="#1d1d1f" strokeWidth="2.2" />
            <path d="M11.5 14V10.5a5.5 5.5 0 0 1 11 0V14" stroke="#1d1d1f" strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="17" cy="21.5" r="2" fill="#1d1d1f" />
          </svg>
          <h2 className="gate-title">비밀번호를 입력하세요.</h2>
          <span className="gate-caption">관리자 전용 화면입니다</span>
        </div>

        <div className={"pin-dots" + (shake ? " shake" : "")}>
          {Array.from({ length: PIN_LENGTH }, (_, i) => (
            <span key={i} className={"pin-dot" + (i < pin.length ? " filled" : "")} />
          ))}
        </div>

        <div className="gate-keypad">
          {KEY_DEFS.map((k, i) => (
            <button
              key={i}
              className={"key" + (k === "del" ? " del" : "") + (k === "" ? " blank" : "")}
              onClick={() => press(k)}
            >
              {k === "del" ? "⌫" : k}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}

function Dashboard() {
  const { users, records, refresh } = useAttendance();
  const [filter, setFilter] = useState<FilterId>("all");

  const stats = useMemo(() => {
    const total = users.length;
    const bySchool = (s: string) => ({
      done: records.filter((r) => !r.forced && r.school === s).length,
      total: users.filter((u) => u.school === s).length,
    });
    const ds = bySchool("대신고");
    const db = bySchool("동방고");
    const dw = bySchool("대전외고");
    const forcedCount = records.filter((r) => r.forced).length;
    const doneCount = records.length;
    const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) + "%" : "0%");
    return [
      { label: "전체 출석", labelColor: "#333333", value: String(doneCount), suffix: "/ " + total + "명", pct: pct(doneCount, total), barColor: "#1d1d1f" },
      { label: "대신고", labelColor: "#248a3d", value: String(ds.done), suffix: "/ " + ds.total + "명", pct: pct(ds.done, ds.total), barColor: "#34c759" },
      { label: "동방고", labelColor: "#d70015", value: String(db.done), suffix: "/ " + db.total + "명", pct: pct(db.done, db.total), barColor: "#ff3b30" },
      { label: "대전외고", labelColor: "#0066cc", value: String(dw.done), suffix: "/ " + dw.total + "명", pct: pct(dw.done, dw.total), barColor: "#0071e3" },
      { label: "강제 출석체크", labelColor: "#d70015", value: String(forcedCount), suffix: "건", pct: pct(forcedCount, doneCount || 1), barColor: "#ff9f0a" },
    ];
  }, [users, records]);

  const rows = useMemo(() => {
    let shown = records.slice().reverse();
    if (filter === "forced") shown = shown.filter((r) => r.forced);
    if (filter === "normal") shown = shown.filter((r) => !r.forced);
    return shown.map((r, i) => ({
      key: r.id,
      idx: String(shown.length - i),
      name: r.name || "(이름 미입력)",
      role: r.role || r.declared_role || "—",
      school: r.school || r.declared_school || "—",
      roleColor: roleColor(r.role || r.declared_role),
      schoolColor: schoolColor(r.school || r.declared_school),
      phone: r.phone || "—",
      time: new Date(r.checked_at).toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      forced: r.forced,
    }));
  }, [records, filter]);

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
      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/moguk_logo.svg" alt="MoGuk" style={{ height: 28, width: "auto" }} />
          <span className="header-title">관리자 대시보드</span>
          <span className="header-caption">제3회 전국모의국회 출석 현황</span>
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
        {/* Stat cards */}
        <div className="stat-grid">
          {stats.map((st) => (
            <div key={st.label} className="stat-card">
              <span className="stat-label" style={{ color: st.labelColor }}>
                {st.label}
              </span>
              <span className="stat-value">
                {st.value}
                <span className="stat-suffix"> {st.suffix}</span>
              </span>
              <div className="stat-track">
                <div className="stat-fill" style={{ background: st.barColor, width: st.pct }} />
              </div>
            </div>
          ))}
        </div>

        {/* Records table */}
        <section className="table-card">
          <div className="table-header">
            <span className="table-title">출석체크 기록</span>
            <div className="filter-group">
              {FILTER_DEFS.map((f) => (
                <button
                  key={f.id}
                  className={"filter-pill" + (filter === f.id ? " selected" : "")}
                  onClick={() => setFilter(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="table-cols">
            <span>#</span>
            <span>이름</span>
            <span>역할</span>
            <span>소속 고등학교</span>
            <span>전화번호</span>
            <span>체크 시각</span>
            <span>구분</span>
          </div>
          <div className="table-body">
            {rows.map((r) => (
              <div key={r.key} className="table-row">
                <span style={{ color: "#7a7a7a", fontVariantNumeric: "tabular-nums", fontSize: 13 }}>{r.idx}</span>
                <span style={{ fontWeight: 600 }}>{r.name}</span>
                <span style={{ color: r.roleColor, fontWeight: 600, fontSize: 14 }}>{r.role}</span>
                <span style={{ color: r.schoolColor, fontWeight: 600, fontSize: 14 }}>{r.school}</span>
                <span style={{ fontVariantNumeric: "tabular-nums", color: "#333333", fontSize: 14 }}>{r.phone}</span>
                <span style={{ fontVariantNumeric: "tabular-nums", color: "#7a7a7a", fontSize: 14 }}>{r.time}</span>
                {r.forced ? <span className="tag-forced">강제 출석체크</span> : <span className="tag-normal">정상</span>}
              </div>
            ))}
            {rows.length === 0 && (
              <div className="table-empty">
                <span>아직 출석체크 기록이 없습니다.</span>
                <span className="table-empty-sub">출석체크가 완료되면 이곳에 실시간으로 표시됩니다.</span>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

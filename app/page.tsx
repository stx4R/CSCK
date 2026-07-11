"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { insertRecord } from "@/lib/attendance";
import { supabase } from "@/lib/supabase";
import { useAttendance } from "@/lib/useAttendance";
import { fmtDigits, roleColor, schoolColor } from "@/lib/colors";

const SUCCESS_HOLD_MS = 3000;
const MAX_DIGITS = 8;

const KEY_DEFS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];
const CONFETTI_COLORS = ["#34c759", "#ff3b30", "#0071e3", "#ffcc00", "#af52de"];

type CheckTarget = {
  id: number | null;
  name: string;
  phone: string;
  school: string | null;
  role: string | null;
};
type Success = { name: string; role: string | null; school: string | null };
type ConfettiPiece = {
  left: number;
  delay: number;
  dur: number;
  size: number;
  color: string;
  round: boolean;
};

function makeConfetti(): ConfettiPiece[] {
  return Array.from({ length: 36 }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    dur: 1.6 + Math.random() * 1.4,
    size: 7 + Math.random() * 7,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    round: Math.random() > 0.5,
  }));
}

export default function AttendanceCheck() {
  const { users, records, refresh } = useAttendance();

  const [digits, setDigits] = useState("");
  const [keypadOpen, setKeypadOpen] = useState(false);
  const [forceOpen, setForceOpen] = useState(false);
  const [forceName, setForceName] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [success, setSuccess] = useState<Success | null>(null);
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const [confirmTarget, setConfirmTarget] = useState<CheckTarget | null>(null);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const successTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const busyRef = useRef(false);

  useEffect(
    () => () => {
      clearTimeout(toastTimer.current);
      clearTimeout(successTimer.current);
    },
    []
  );

  const showToast = (msg: string) => {
    clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  };

  const resetAll = () => {
    setDigits("");
    setKeypadOpen(false);
    setForceOpen(false);
    setForceName("");
    setSuccess(null);
    setConfirmTarget(null);
  };

  const checkedIds = useMemo(() => {
    const set = new Set<number>();
    records.forEach((r) => {
      if (!r.forced && r.user_id != null) set.add(r.user_id);
    });
    return set;
  }, [records]);

  const matches = useMemo(
    () => (digits ? users.filter((u) => u.digits.startsWith(digits)) : users),
    [users, digits]
  );
  const noMatch = digits.length > 0 && matches.length === 0;
  const matchedStr = digits ? "010-" + fmtDigits(digits) : "";

  const completeCheck = async (u: CheckTarget, forced: boolean) => {
    if (!forced && u.id != null && checkedIds.has(u.id)) {
      showToast("이미 출석체크가 완료된 사용자입니다.");
      return;
    }
    if (busyRef.current) return;
    busyRef.current = true;
    const result = await insertRecord({
      user_id: forced ? null : u.id,
      name: u.name,
      phone: u.phone || null,
      school: u.school,
      role: u.role,
      declared_role: null,
      declared_school: null,
      forced,
    });
    busyRef.current = false;
    if (result === "duplicate") {
      showToast("이미 출석체크가 완료된 사용자입니다.");
      refresh();
      return;
    }
    if (result === "error") {
      showToast("저장에 실패했습니다. 네트워크 상태를 확인해주세요.");
      return;
    }
    refresh();
    setConfetti(makeConfetti());
    setSuccess({
      name: u.name,
      role: u.role,
      school: u.school,
    });
    setKeypadOpen(false);
    clearTimeout(successTimer.current);
    successTimer.current = setTimeout(resetAll, SUCCESS_HOLD_MS);
  };

  const pressKey = (k: string) => {
    if (k === "") return;
    if (k === "del") setDigits((d) => d.slice(0, -1));
    else setDigits((d) => (d.length < MAX_DIGITS ? d + k : d));
  };

  const forcePanelVisible = noMatch && forceOpen;
  const inlineKeypadRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (forcePanelVisible && keypadOpen) {
      inlineKeypadRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [forcePanelVisible, keypadOpen]);

  const keypadButtons = KEY_DEFS.map((k, i) => (
    <button
      key={i}
      className={"key" + (k === "del" ? " del" : "") + (k === "" ? " blank" : "")}
      onClick={(e) => {
        e.stopPropagation();
        pressKey(k);
      }}
    >
      {k === "del" ? "⌫" : k}
    </button>
  ));

  const forceComplete = () => {
    const name = forceName.trim();
    if (!name && !digits) {
      showToast("이름 또는 전화번호를 입력해주세요.");
      return;
    }
    completeCheck(
      {
        id: null,
        name: name || "(이름 미입력)",
        phone: digits ? "010-" + fmtDigits(digits) : "",
        school: null,
        role: null,
      },
      true
    );
  };

  return (
    <div
      className="screen kiosk"
      data-screen-label="출석체크 메인"
      onClick={() => {
        if (keypadOpen) setKeypadOpen(false);
      }}
    >
      {/* ============ Header ============ */}
      <header className="app-header">
        <div
          className="header-left header-home"
          role="button"
          title="처음 화면으로"
          onClick={(e) => {
            e.stopPropagation();
            resetAll();
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/moguk_logo.svg" alt="MoGuk" style={{ height: 28, width: "auto" }} />
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span className="header-title">제3회 오량모의국회 출석체크</span>
            {!supabase && (
              <span className="header-caption" style={{ color: "#ff9f0a", fontWeight: 600 }}>
                오프라인 모드 — Supabase 미연결 (기록이 이 기기에만 저장됩니다)
              </span>
            )}
          </div>
        </div>
        <Link href="/dashboard" className="pill-link" onClick={(e) => e.stopPropagation()}>
          관리자 대시보드
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M4 2.5L8 6L4 9.5" stroke="#0066cc" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </header>

      {/* ============ Main ============ */}
      <main className="kiosk-main">
        {/* ===== Left: steps ===== */}
        <section className="steps">
          {/* Step: phone + keypad */}
          <div className="step phone-step">
            <h2
              className="step-title clickable"
              onClick={(e) => {
                e.stopPropagation();
                setKeypadOpen(true);
              }}
            >
              자신의 전화번호를 입력하세요.
            </h2>
            <div
              className={"phone-field" + (keypadOpen ? " open" : "")}
              onClick={(e) => {
                e.stopPropagation();
                setKeypadOpen(true);
              }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ marginRight: 8, flex: "none" }}>
                <path
                  d="M6.5 2.5h7A1.5 1.5 0 0 1 15 4v12a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 5 16V4a1.5 1.5 0 0 1 1.5-1.5Z"
                  stroke="#7a7a7a"
                  strokeWidth="1.4"
                />
                <circle cx="10" cy="15" r="0.9" fill="#7a7a7a" />
              </svg>
              <span className="phone-prefix">010-</span>
              <span className="phone-digits">{fmtDigits(digits)}</span>
              {keypadOpen && <span className="phone-caret" />}
              {digits.length > 0 && <span className="phone-count">{matches.length}명</span>}
            </div>

            {/* keypad — morphs from field */}
            <div
              className={"keypad" + (keypadOpen && !forcePanelVisible ? " open" : "")}
              onClick={(e) => e.stopPropagation()}
            >
              {keypadButtons}
            </div>
          </div>

          {/* Step 5: no match → alert + forced check-in */}
          {noMatch && (
            <div
              className={"no-match-block" + (keypadOpen && !forcePanelVisible ? " push-down" : "")}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="alert-red">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flex: "none", marginTop: 1 }}>
                  <circle cx="10" cy="10" r="8.2" stroke="#d70015" strokeWidth="1.5" />
                  <path d="M10 6v4.5" stroke="#d70015" strokeWidth="1.6" strokeLinecap="round" />
                  <circle cx="10" cy="13.6" r="1" fill="#d70015" />
                </svg>
                <div className="alert-red-text">
                  <p>구글 폼 신청서 데이터베이스에 입력하신 전화번호와 일치하는 참가자 및 운영자가 존재하지 않습니다.</p>
                  <p>강제로 출석체크를 진행하시겠습니까?</p>
                </div>
              </div>
              {!forceOpen ? (
                <button
                  className="force-toggle"
                  onClick={(e) => {
                    e.stopPropagation();
                    setForceOpen(true);
                    setKeypadOpen(false);
                  }}
                >
                  강제로 출석체크 완료하기
                </button>
              ) : (
                <>
                  <div className="force-panel">
                    <span className="force-panel-title">강제로 출석체크 완료하기</span>
                    <span className="force-field-label">이름</span>
                    <input
                      className="force-input"
                      value={forceName}
                      onChange={(e) => setForceName(e.target.value)}
                      onFocus={() => setKeypadOpen(false)}
                      placeholder="이름을 입력하세요"
                    />
                    <span className="force-field-label">전화번호</span>
                    <div
                      className="force-phone-field"
                      onClick={(e) => {
                        e.stopPropagation();
                        setKeypadOpen(true);
                      }}
                    >
                      <span className="force-phone-prefix">010-</span>
                      <span className="force-phone-digits">{fmtDigits(digits)}</span>
                      <span className="force-phone-hint">키패드로 입력</span>
                    </div>
                    <button
                      className="force-done"
                      onClick={(e) => {
                        e.stopPropagation();
                        forceComplete();
                      }}
                    >
                      완료
                    </button>
                  </div>
                  {/* keypad — morphs from field */}
                  {keypadOpen && (
                    <div ref={inlineKeypadRef} className="keypad inline" onClick={(e) => e.stopPropagation()}>
                      {keypadButtons}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </section>

        {/* ===== Right: Status Window ===== */}
        <section className="status-card">
          <div className="status-header">
            <p>귀하가 입력하신 전화번호에 해당하는 참가자 및 운영자는 아래와 같습니다.</p>
            <span className="status-count">{matches.length}명</span>
          </div>
          <div className="status-list">
            {matches.map((u) => {
              const checked = checkedIds.has(u.id);
              return (
                <button
                  key={u.id}
                  className={"user-row" + (checked ? " checked" : "")}
                  onClick={(e) => {
                    e.stopPropagation();
                    setKeypadOpen(false);
                    if (checked) {
                      showToast("이미 출석체크가 완료된 사용자입니다.");
                      return;
                    }
                    setConfirmTarget({ id: u.id, name: u.name, phone: u.phone, school: u.school ?? null, role: u.role });
                  }}
                >
                  <div
                    className="avatar"
                    style={{
                      background: u.role === "운영자" ? "rgba(255,59,48,0.10)" : "rgba(52,199,89,0.12)",
                      color: roleColor(u.role),
                    }}
                  >
                    {u.name.charAt(0)}
                  </div>
                  <div className="user-info">
                    <span className="user-name">{u.name}</span>
                    <span className="user-sub">
                      <span style={{ color: roleColor(u.role), fontWeight: 600 }}>{u.role}</span>
                      <span className="dot-sep">·</span>
                      <span style={{ color: schoolColor(u.school), fontWeight: 600 }}>{u.school || "소속 미상"}</span>
                      <span className="dot-sep">·</span>
                      <span style={{ fontVariantNumeric: "tabular-nums" }}>
                        <span style={{ color: "#0066cc", fontWeight: 600 }}>{matchedStr}</span>
                        <span style={{ color: "#a8a8ad" }}>{u.phone.slice(matchedStr.length)}</span>
                      </span>
                    </span>
                  </div>
                  {checked ? (
                    <span className="done-pill">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 6.2L5 8.7L9.5 3.5" stroke="#248a3d" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      출석 완료
                    </span>
                  ) : (
                    <span className="check-pill">출석체크</span>
                  )}
                </button>
              );
            })}
            {noMatch && (
              <div className="empty-state">
                <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
                  <circle cx="19" cy="19" r="10" stroke="#d2d2d7" strokeWidth="2.5" />
                  <path d="M27 27L35 35" stroke="#d2d2d7" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
                <span>일치하는 사용자가 없습니다</span>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* ============ 출석체크 확인 ============ */}
      {confirmTarget && (
        <div className="overlay" style={{ zIndex: 45 }} onClick={() => setConfirmTarget(null)}>
          <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
            <div
              className="avatar"
              style={{
                width: 56,
                height: 56,
                fontSize: 21,
                background: confirmTarget.role === "운영자" ? "rgba(255,59,48,0.10)" : "rgba(52,199,89,0.12)",
                color: roleColor(confirmTarget.role || "참가자"),
              }}
            >
              {confirmTarget.name.charAt(0)}
            </div>
            <span className="confirm-title">
              <strong>{confirmTarget.name}</strong>님으로
              <br />
              출석체크를 하시겠습니까?
            </span>
            {(confirmTarget.role || confirmTarget.school || confirmTarget.phone) && (
              <span className="confirm-sub">
                {confirmTarget.role && (
                  <span style={{ color: roleColor(confirmTarget.role), fontWeight: 600 }}>{confirmTarget.role}</span>
                )}
                {confirmTarget.role && confirmTarget.school && <span className="dot-sep">·</span>}
                {confirmTarget.school && (
                  <span style={{ color: schoolColor(confirmTarget.school), fontWeight: 600 }}>
                    {confirmTarget.school}
                  </span>
                )}
                {confirmTarget.phone && (confirmTarget.role || confirmTarget.school) && (
                  <span className="dot-sep">·</span>
                )}
                {confirmTarget.phone && (
                  <span style={{ fontVariantNumeric: "tabular-nums" }}>{confirmTarget.phone}</span>
                )}
              </span>
            )}
            <div className="confirm-actions">
              <button className="confirm-no" onClick={() => setConfirmTarget(null)}>
                아니요
              </button>
              <button
                className="confirm-yes"
                onClick={() => {
                  const target = confirmTarget;
                  setConfirmTarget(null);
                  completeCheck(target, false);
                }}
              >
                네
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ Toast ============ */}
      {toast && <div className="toast">{toast}</div>}

      {/* ============ Success overlay ============ */}
      {success && (
        <div className="overlay">
          <div className="confetti-layer">
            {confetti.map((c, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  top: "-5%",
                  left: c.left + "%",
                  width: c.size,
                  height: c.size * (c.round ? 1 : 0.55),
                  background: c.color,
                  borderRadius: c.round ? "50%" : 2,
                  animation: `confettiFall ${c.dur}s ${c.delay}s cubic-bezier(0.25,0.46,0.45,0.94) forwards`,
                }}
              />
            ))}
          </div>
          <div className="success-card">
            <div className="success-circle">
              <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
                <path
                  className="success-check"
                  d="M12 27L22 37L40 16"
                  stroke="#ffffff"
                  strokeWidth="5.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <span className="success-title">출석체크 완료!</span>
              <span className="success-name">{success.name}</span>
              {(success.role || success.school) && (
                <span className="success-sub">
                  {success.role && (
                    <span style={{ color: roleColor(success.role), fontWeight: 600 }}>{success.role}</span>
                  )}
                  {success.role && success.school && <span className="dot-sep">·</span>}
                  {success.school && (
                    <span style={{ color: schoolColor(success.school), fontWeight: 600 }}>{success.school}</span>
                  )}
                </span>
              )}
            </div>
            <span className="success-hint">잠시 후 처음 화면으로 돌아갑니다</span>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";

const PIN_LENGTH = 6;
const KEY_DEFS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

export default function UnlockPage() {
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);
  const [checking, setChecking] = useState(false);

  const fail = () => {
    setChecking(false);
    setShake(true);
    setTimeout(() => {
      setShake(false);
      setPin("");
    }, 500);
  };

  const submit = async (candidate: string) => {
    setChecking(true);
    try {
      const res = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: candidate }),
      });
      if (res.ok) {
        window.location.replace("/dashboard");
        return;
      }
      fail();
    } catch {
      fail();
    }
  };

  const press = (k: string) => {
    if (shake || checking || k === "") return;
    if (k === "del") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    setPin((p) => {
      if (p.length >= PIN_LENGTH) return p;
      const next = p + k;
      if (next.length === PIN_LENGTH) submit(next);
      return next;
    });
  };

  return (
    <div className="screen" data-screen-label="대시보드 비밀번호">
      <header className="app-header">
        <div className="header-left">
          <img src="/moguk_logo.svg" alt="MoGuk" style={{ height: 28, width: "auto" }} />
          <span className="header-title">관리자 대시보드</span>
          <span className="header-caption">제3회 오량모의국회 출석 현황</span>
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

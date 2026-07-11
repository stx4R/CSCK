# 제3회 오량모의국회 출석체크 (MoGuk Attendance Check)

iPad(가로) 전용 출석체크 웹앱 — Next.js(App Router) + Supabase.
행사장 입구의 공용 iPad에서 키패드로 전화번호 입력 → 명단에서 본인 탭 → 완료 애니메이션.
관리자 대시보드에서 실시간 출석 현황을 확인합니다.

## 화면

| 경로 | 설명 |
| --- | --- |
| `/` | 출석체크 메인 (키오스크) |
| `/dashboard` | 관리자 대시보드 (비밀번호 키패드 잠금 → 실시간 통계 + 기록 테이블) |

대시보드 비밀번호는 기본 `031649`이며 `NEXT_PUBLIC_DASHBOARD_PASSWORD` 환경변수로 변경할 수 있습니다.
(클라이언트 측 잠금이므로 번들 소스에 노출됩니다 — 공용 태블릿에서의 우발적 접근 차단 용도입니다.)

## 실행

```bash
npm install
npm run dev   # http://localhost:3000
```

Supabase 환경변수(`.env.local`)가 **없으면 localStorage 프로토타입 모드**로 동작합니다
(명단은 내장 `lib/roster.ts` 133명, 기록은 브라우저 localStorage — 데모/개발용).

## Supabase 연결 (프로덕션)

1. https://supabase.com → New project (리전: Northeast Asia (Seoul) 권장)
2. SQL Editor에서 `supabase/schema.sql` 실행 → 이어서 `supabase/seed.sql` 실행 (명단 133명)
3. Settings → API 의 값으로 `.env.local` 작성 (`.env.local.example` 참고):
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
4. 대시보드는 `attendance` 테이블의 Realtime(postgres_changes) 구독으로 즉시 갱신됩니다.
5. "기록 초기화"는 기본 RLS에서 익명 키로 막혀 있습니다. 행사 당일 초기화가 필요하면
   `schema.sql` 하단의 `anon can delete attendance` 정책 주석을 해제하세요.

## Vercel 배포

1. GitHub에 푸시 → Vercel **Add New → Project** 로 저장소 연결 (Next.js 자동 감지)
2. Environment Variables에 위 두 값 추가 → Deploy
3. iPad Safari에서 배포 URL 열고 **공유 → 홈 화면에 추가** 하면 전체화면 앱처럼 동작합니다.

## 구조

```
app/page.tsx            출석체크 메인 화면
app/dashboard/page.tsx  관리자 대시보드
app/globals.css         디자인 토큰·애니메이션 (Apple Design System 프로토타입 기준)
lib/attendance.ts       데이터 계층 (Supabase ↔ localStorage 자동 전환)
lib/roster.ts           내장 명단 (supabase/seed.sql에서 자동 생성)
supabase/schema.sql     테이블 + RLS + Realtime
supabase/seed.sql       명단 시드 (133명)
```

디자인 원본: claude.ai/design 프로젝트의 `Attendance Check.dc.html` / `Dashboard.dc.html`.

-- ============================================================
-- Oryangmo 제3회 오량모의국회 출석체크 — Supabase schema
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- 1) 명단 (roster) — from 'Users Name and Tel number and high school.xlsx'
create table public.users (
  id          bigint generated always as identity primary key,
  name        text not null,               -- 이유빈A, 김지후B 등 접미사 그대로
  phone       text not null,               -- '010-8297-1061' 형식
  digits      text not null,               -- 010- 이후 숫자만: '82971061' (prefix 검색용)
  school      text check (school in ('대신고','동방고','대전외고')),
  role        text not null check (role in ('참가자','운영자')),
  created_at  timestamptz not null default now()
);

create index users_digits_idx on public.users (digits text_pattern_ops); -- like '12%' 검색용
create unique index users_name_phone_idx on public.users (name, phone);

-- 2) 출석 기록 (attendance records)
create table public.attendance (
  id               bigint generated always as identity primary key,
  user_id          bigint references public.users(id),  -- 강제 출석이면 null 가능
  name             text not null,
  phone            text,
  school           text,
  role             text,
  declared_role    text,        -- Button1에서 사용자가 선택한 값
  declared_school  text,        -- Button2에서 사용자가 선택한 값
  forced           boolean not null default false,
  checked_at       timestamptz not null default now()
);

-- 중복 출석 방지 (정상 체크만; 강제 출석은 중복 허용)
create unique index attendance_once_idx
  on public.attendance (user_id) where (forced = false and user_id is not null);

-- 3) Row Level Security
alter table public.users enable row level security;
alter table public.attendance enable row level security;

-- 태블릿(익명 키)에서: 명단 읽기 + 출석 기록 쓰기/읽기
create policy "anon can read roster"      on public.users      for select to anon using (true);
create policy "anon can read attendance"  on public.attendance for select to anon using (true);
create policy "anon can insert attendance" on public.attendance for insert to anon with check (true);
-- 기록 삭제(초기화)는 service_role 또는 대시보드에서만. 필요 시 아래 주석 해제:
-- create policy "anon can delete attendance" on public.attendance for delete to anon using (true);

-- 4) 대시보드 실시간 반영 (Realtime)
alter publication supabase_realtime add table public.attendance;

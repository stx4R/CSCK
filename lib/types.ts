export type Role = "참가자" | "운영자";
export type School = "대신고" | "동방고" | "대전외고";

export interface User {
  id: number;
  name: string;
  phone: string;
  digits: string; // 010- 이후 숫자만 (prefix 검색용)
  school: School | string | null;
  role: Role | string;
}

export interface AttendanceRecord {
  id: number;
  user_id: number | null; // 강제 출석이면 null
  name: string;
  phone: string | null;
  school: string | null;
  role: string | null;
  declared_role: string | null; // Step 1에서 선택한 값
  declared_school: string | null; // Step 2에서 선택한 값
  forced: boolean;
  checked_at: string;
}

export type NewRecord = Omit<AttendanceRecord, "id" | "checked_at">;

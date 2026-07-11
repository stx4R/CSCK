export type Role = "참가자" | "운영자";
export type School = "대신고" | "동방고" | "대전외고";

export interface User {
  id: number;
  name: string;
  phone: string;
  digits: string;
  school: School | string | null;
  role: Role | string;
}

export interface AttendanceRecord {
  id: number;
  user_id: number | null;
  name: string;
  phone: string | null;
  school: string | null;
  role: string | null;
  declared_role: string | null;
  declared_school: string | null;
  forced: boolean;
  checked_at: string;
}

export type NewRecord = Omit<AttendanceRecord, "id" | "checked_at">;

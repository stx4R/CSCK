export function roleColor(role: string | null | undefined): string {
  if (role === "운영자") return "#d70015";
  if (role === "참가자") return "#248a3d";
  return "#7a7a7a";
}

export function schoolColor(school: string | null | undefined): string {
  if (school === "대신고") return "#248a3d";
  if (school === "동방고") return "#d70015";
  if (school === "대전외고") return "#0066cc";
  return "#7a7a7a";
}

/** 전화번호 자릿수 포맷: 'XXXX' 까지는 그대로, 이후 'XXXX-XXXX' */
export function fmtDigits(d: string): string {
  if (!d) return "";
  return d.length <= 4 ? d : d.slice(0, 4) + "-" + d.slice(4);
}

// ===== Supabase 연결 설정 =====
// Supabase 대시보드 → Settings → API 에서 아래 두 값을 복사해 채우세요.
//  1) Project URL      예: https://abcdefghijklmno.supabase.co
//  2) anon public key  (반드시 "anon" "public" 키를 쓰세요. service_role 키는 절대 넣지 마세요!)
//
// anon key는 브라우저에 노출되어도 되는 공개 키입니다.
// 실제 데이터 보호는 Supabase의 Row Level Security(RLS) 정책으로 처리합니다.
// (supabase-setup.sql 의 정책을 Supabase SQL Editor에서 먼저 실행하세요.)

window.SUPABASE_CONFIG = {
  url: "https://rlqptxxralidfozfubqp.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJscXB0eHhyYWxpZGZvemZ1YnFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM1OTE0MjgsImV4cCI6MjEwOTE2NzQyOH0.mV3RasI2KSCQ8UXoGDkjUIEilaDSVRMZOOgCxH7D7Uk",
};

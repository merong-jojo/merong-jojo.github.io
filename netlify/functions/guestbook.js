// 방명록 서버 함수 (Netlify Function)
//
// 구조: 브라우저 → 이 함수 → Supabase
// 브라우저는 Supabase에 직접 접근하지 않고, 항상 이 함수를 거칩니다.
//
// 이 함수는 서버에서만 실행되므로, RLS를 우회하는 "서버 전용 비밀 키"
// (SUPABASE_SERVICE_ROLE_KEY)를 사용합니다. 이 키는 브라우저에 절대 노출되지 않습니다.
// 비밀 키가 RLS를 우회하기 때문에, 데이터 검증(이름/메시지 길이 등)의 책임은
// 이 서버 함수가 집니다. (아래 validate 참고)
//
// 필요한 환경변수 (Netlify 대시보드 → Site configuration → Environment variables):
//   - SUPABASE_URL                : Supabase 프로젝트 URL
//   - SUPABASE_SERVICE_ROLE_KEY   : Supabase service_role 키 (비밀. 절대 코드/깃에 넣지 않음)

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  };
}

// 서버가 책임지는 입력 검증
function validate(name, message) {
  if (typeof name !== "string" || typeof message !== "string") {
    return "이름과 메시지를 문자열로 보내 주세요.";
  }
  const n = name.trim();
  const m = message.trim();
  if (n.length < 1 || n.length > 40) return "이름은 1~40자여야 해요.";
  if (m.length < 1 || m.length > 500) return "메시지는 1~500자여야 해요.";
  return null;
}

exports.handler = async (event) => {
  // 환경변수가 없으면 서버 설정 문제
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return json(500, { error: "서버에 Supabase 설정이 없습니다. 환경변수를 확인하세요." });
  }

  const client = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // ---------- 목록 조회 ----------
  if (event.httpMethod === "GET") {
    const { data, error } = await client
      .from("guestbook")
      .select("name, message, created_at")
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      return json(500, { error: "방명록을 불러오지 못했어요." });
    }
    return json(200, { items: data });
  }

  // ---------- 저장 ----------
  if (event.httpMethod === "POST") {
    let payload;
    try {
      payload = JSON.parse(event.body || "{}");
    } catch {
      return json(400, { error: "잘못된 요청 형식이에요." });
    }

    const name = payload.name;
    const message = payload.message;

    const invalid = validate(name, message);
    if (invalid) {
      return json(400, { error: invalid });
    }

    const { error } = await client
      .from("guestbook")
      .insert({ name: name.trim(), message: message.trim() });

    if (error) {
      return json(500, { error: "저장에 실패했어요. 잠시 후 다시 시도해 주세요." });
    }
    return json(201, { ok: true });
  }

  return json(405, { error: "지원하지 않는 메서드예요." });
};

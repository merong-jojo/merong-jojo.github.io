# Supabase 연동 설정 가이드

이 홈페이지는 Supabase를 연동해 두 가지 동적 기능을 제공합니다.

- **좋아요 버튼** (첫 화면): 방문자가 누른 좋아요 수를 실시간으로 누적·표시
- **방명록** (맨 아래): 방문자가 이름·메시지를 남기면 저장하고 목록으로 보여줌

호스팅은 Netlify(또는 현재 GitHub Pages), 데이터 저장은 Supabase가 맡습니다.

---

## 설정 순서 (한 번만)

### 1. Supabase 프로젝트 만들기
1. https://supabase.com 에서 프로젝트를 생성합니다.
2. 왼쪽 메뉴 **SQL Editor** 를 엽니다.

### 2. 테이블 + 보안 정책 만들기
1. 이 저장소의 `supabase-setup.sql` 내용을 전부 복사합니다.
2. SQL Editor에 붙여넣고 **Run** 을 누릅니다.
3. `guestbook`, `likes` 테이블과 RLS 정책, `increment_likes` 함수가 생성됩니다.

### 3. 연결 키 넣기
1. Supabase 대시보드 → **Settings → API** 로 이동합니다.
2. 아래 두 값을 복사합니다.
   - **Project URL**
   - **anon public** key
3. `supabase-config.js` 를 열어 두 값을 채웁니다.

```js
window.SUPABASE_CONFIG = {
  url: "https://xxxxxxxx.supabase.co",
  anonKey: "eyJhbGci...(anon public key)",
};
```

> ⚠️ **service_role 키는 절대 넣지 마세요.** 그 키는 모든 보안을 우회하며 브라우저에 노출되면 안 됩니다.
> anon public 키는 브라우저에 노출되는 전제로 설계된 공개 키이며, 실제 보호는 RLS 정책이 담당합니다.

### 4. 배포
- 변경한 파일(`index.html`, `script.js`, `style.css`, `supabase-config.js`)을 커밋/푸시하면 끝입니다.

---

## 보안 설계 메모 (RLS)

- **guestbook**: 누구나 읽기(select)와 남기기(insert)만 가능. 수정/삭제는 막혀 있고, 이름 40자·메시지 500자 길이 제한을 DB에서 강제합니다.
- **likes**: 누구나 읽기만 가능. 숫자를 임의로 조작하지 못하도록 테이블 직접 UPDATE는 막고, `increment_likes()` 함수로 "1씩 증가"만 허용합니다.

## 비용
- 좋아요/방명록 정도의 트래픽은 Supabase 무료 플랜 한도 안에서 충분합니다.

-- =====================================================================
--  홈페이지 Supabase 설정 SQL
--  Supabase 대시보드 → SQL Editor 에 붙여넣고 "Run" 하세요.
--  (한 번만 실행하면 됩니다.)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) 방명록 테이블 (옵션 A)
-- ---------------------------------------------------------------------
create table if not exists public.guestbook (
  id         bigint generated always as identity primary key,
  name       text not null check (char_length(name) between 1 and 40),
  message    text not null check (char_length(message) between 1 and 500),
  created_at timestamptz not null default now()
);

alter table public.guestbook enable row level security;

-- 누구나(anon 포함) 방명록을 읽을 수 있음
drop policy if exists "guestbook read for all" on public.guestbook;
create policy "guestbook read for all"
  on public.guestbook for select
  to anon, authenticated
  using (true);

-- 누구나(anon 포함) 방명록을 남길 수 있음 (insert만, 수정/삭제는 불가)
drop policy if exists "guestbook insert for all" on public.guestbook;
create policy "guestbook insert for all"
  on public.guestbook for insert
  to anon, authenticated
  with check (
    char_length(name) between 1 and 40
    and char_length(message) between 1 and 500
  );

-- ---------------------------------------------------------------------
-- 2) 좋아요 카운터 테이블 (옵션 B)
--    단일 행(id = 1)에 누적 수를 저장하고, 함수로 안전하게 1씩 증가시킴
-- ---------------------------------------------------------------------
create table if not exists public.likes (
  id    int primary key,
  count bigint not null default 0
);

-- 기본 행 1개 보장
insert into public.likes (id, count)
values (1, 0)
on conflict (id) do nothing;

alter table public.likes enable row level security;

-- 누구나 좋아요 수를 읽을 수 있음
drop policy if exists "likes read for all" on public.likes;
create policy "likes read for all"
  on public.likes for select
  to anon, authenticated
  using (true);

-- 좋아요 증가는 테이블 직접 UPDATE가 아니라 아래 함수로만 수행 (임의 값 조작 방지)
create or replace function public.increment_likes()
returns bigint
language sql
security definer
set search_path = public
as $$
  update public.likes
     set count = count + 1
   where id = 1
  returning count;
$$;

-- anon 사용자가 이 함수를 호출할 수 있도록 실행 권한 부여
grant execute on function public.increment_likes() to anon, authenticated;

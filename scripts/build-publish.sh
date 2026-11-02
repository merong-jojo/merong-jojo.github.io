#!/usr/bin/env bash
# 공개 배포용 빌드 스크립트
#
# 저장소 루트의 공개 자산만 publish/ 로 "복사"합니다 (원본은 그대로 유지).
# 화이트리스트 방식: 아래 PUBLIC_FILES 에 나열한 것만 포함됩니다.
# 따라서 .git, .env, .kiro, docs(개인 기록), node_modules,
# 서버 설정/비밀 코드(supabase-setup.sql 등), 임시 파일은 자동으로 제외됩니다.
#
# 서버 함수는 복사하지 않습니다 (이 사이트에는 서버 함수가 없음).

set -euo pipefail

OUT="publish"

# 공개할 파일 화이트리스트 (브라우저가 직접 로드하는 자산만)
PUBLIC_FILES=(
  "index.html"
  "style.css"
  "script.js"
  "supabase-config.js"
)

# 공개할 디렉터리 화이트리스트 (이미지/정적 자산 폴더가 생기면 여기에 추가)
PUBLIC_DIRS=(
  "assets"
  "images"
  "img"
)

# 깨끗한 출력 디렉터리 준비
rm -rf "$OUT"
mkdir -p "$OUT"

for f in "${PUBLIC_FILES[@]}"; do
  if [ -f "$f" ]; then
    cp "$f" "$OUT/"
    echo "copied file: $f"
  else
    echo "skip (missing): $f"
  fi
done

for d in "${PUBLIC_DIRS[@]}"; do
  if [ -d "$d" ]; then
    cp -R "$d" "$OUT/"
    echo "copied dir:  $d/"
  fi
done

echo "--- publish contents ---"
ls -la "$OUT"

// 소개 탭 전환
const tabs = document.querySelectorAll(".tab");
const panels = document.querySelectorAll(".tab-panel");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const target = tab.dataset.tab;

    tabs.forEach((t) => {
      const active = t === tab;
      t.classList.toggle("is-active", active);
      t.setAttribute("aria-selected", active ? "true" : "false");
    });

    panels.forEach((panel) => {
      panel.classList.toggle("is-active", panel.dataset.panel === target);
    });
  });
});

// 작업 카드 펼치기 / 접기
document.querySelectorAll(".card-head").forEach((head) => {
  head.addEventListener("click", () => {
    const card = head.closest(".card");
    const open = card.classList.toggle("is-open");
    head.setAttribute("aria-expanded", open ? "true" : "false");
    const toggle = head.querySelector(".card-toggle");
    if (toggle) toggle.textContent = open ? "−" : "+";
  });
});

// 기록 타임라인 펼치기 / 접기
document.querySelectorAll(".timeline-head").forEach((head) => {
  head.addEventListener("click", () => {
    const item = head.closest("li");
    const open = item.classList.toggle("is-open");
    head.setAttribute("aria-expanded", open ? "true" : "false");
  });
});

// 스크롤하면 섹션이 부드럽게 등장
const revealEls = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  revealEls.forEach((el) => observer.observe(el));
} else {
  // IntersectionObserver를 지원하지 않는 환경에서는 바로 보이게
  revealEls.forEach((el) => el.classList.add("is-visible"));
}

// 마우스를 따라다니는 반짝임 효과
(function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  const sparkles = ["✦", "✧", "❄", "✨", "⭐"];
  let last = 0;

  document.addEventListener("pointermove", (e) => {
    const now = Date.now();
    if (now - last < 90) return; // 너무 자주 생기지 않게 조절
    last = now;

    const s = document.createElement("span");
    s.className = "sparkle";
    s.textContent = sparkles[Math.floor(Math.random() * sparkles.length)];
    s.style.left = e.clientX + "px";
    s.style.top = e.clientY + "px";
    s.style.color = Math.random() > 0.5 ? "#c99a2e" : "#7b1e2b";
    document.body.appendChild(s);

    setTimeout(() => s.remove(), 800);
  });
})();

// ===== 좋아요 (브라우저 → Supabase 직접, anon public 키) =====
(function () {
  const cfg = window.SUPABASE_CONFIG || {};
  const configured =
    cfg.url &&
    cfg.anonKey &&
    !cfg.url.includes("여기에") &&
    !cfg.anonKey.includes("여기에");

  const likeButton = document.getElementById("like-button");
  const likeCountEl = document.getElementById("like-count");

  // 설정이 아직 안 됐으면 좋아요만 안내하고 중단 (방명록은 아래 별도 블록에서 동작)
  if (!configured || !window.supabase) {
    if (likeCountEl) likeCountEl.textContent = "–";
    if (likeButton) {
      likeButton.addEventListener("click", () => {
        alert("좋아요 기능은 Supabase 설정 후 작동해요. (supabase-config.js에 URL과 키를 넣어 주세요.)");
      });
    }
    return;
  }

  const client = window.supabase.createClient(cfg.url, cfg.anonKey);

  // ---------- 좋아요 ----------
  async function loadLikes() {
    const { data, error } = await client
      .from("likes")
      .select("count")
      .eq("id", 1)
      .single();
    if (error) {
      console.error("좋아요 불러오기 실패:", error.message);
      return;
    }
    if (likeCountEl) likeCountEl.textContent = data.count;
  }

  async function addLike() {
    if (!likeButton) return;
    likeButton.disabled = true;
    // 낙관적 업데이트: 눌리자마자 숫자부터 올림
    const prev = parseInt(likeCountEl.textContent, 10);
    if (!Number.isNaN(prev)) likeCountEl.textContent = prev + 1;
    likeButton.classList.add("is-liked");

    const { data, error } = await client.rpc("increment_likes");
    if (error) {
      console.error("좋아요 실패:", error.message);
      if (!Number.isNaN(prev)) likeCountEl.textContent = prev; // 롤백
    } else if (typeof data === "number") {
      likeCountEl.textContent = data; // 서버 실제 값으로 보정
    }
    likeButton.disabled = false;
  }

  if (likeButton) {
    likeButton.addEventListener("click", addLike);
    loadLikes();
  }
})();

// ===== 방명록 (브라우저 → Netlify Function → Supabase) =====
// 브라우저는 Supabase에 직접 접근하지 않고 /api/guestbook 서버 함수를 거칩니다.
// 따라서 supabase-config.js 설정 여부와 무관하게 동작합니다.
(function () {
  const gbForm = document.getElementById("guestbook-form");
  const gbList = document.getElementById("guestbook-list");
  const gbEmpty = document.getElementById("guestbook-empty");
  const gbStatus = document.getElementById("gb-status");
  const gbSubmit = document.getElementById("gb-submit");

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c]));
  }

  function formatDate(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function renderMessages(rows) {
    if (!gbList) return;
    // 기존 메시지 항목 제거 (빈 안내는 제어용으로 둠)
    gbList.querySelectorAll(".guestbook-item").forEach((el) => el.remove());

    if (!rows || rows.length === 0) {
      if (gbEmpty) gbEmpty.style.display = "";
      return;
    }
    if (gbEmpty) gbEmpty.style.display = "none";

    rows.forEach((row) => {
      const li = document.createElement("li");
      li.className = "guestbook-item";
      li.innerHTML =
        '<div class="gb-head">' +
        '<span class="gb-name">' + escapeHtml(row.name) + "</span>" +
        '<span class="gb-date">' + formatDate(row.created_at) + "</span>" +
        "</div>" +
        '<p class="gb-message">' + escapeHtml(row.message) + "</p>";
      gbList.appendChild(li);
    });
  }

  // 방명록은 서버 함수(/api/guestbook)를 거칩니다. (브라우저 → 함수 → Supabase)
  async function loadGuestbook() {
    try {
      const res = await fetch("/api/guestbook", { method: "GET" });
      const body = await res.json();
      if (!res.ok) {
        console.error("방명록 불러오기 실패:", body.error);
        if (gbStatus) gbStatus.textContent = "방명록을 불러오지 못했어요.";
        return;
      }
      renderMessages(body.items);
    } catch (err) {
      console.error("방명록 불러오기 실패:", err.message);
      if (gbStatus) gbStatus.textContent = "방명록을 불러오지 못했어요.";
    }
  }

  async function submitGuestbook(e) {
    e.preventDefault();
    const nameEl = document.getElementById("gb-name");
    const msgEl = document.getElementById("gb-message");
    const name = nameEl.value.trim();
    const message = msgEl.value.trim();

    if (!name || !message) {
      if (gbStatus) gbStatus.textContent = "이름과 메시지를 모두 입력해 주세요.";
      return;
    }

    if (gbSubmit) gbSubmit.disabled = true;
    if (gbStatus) gbStatus.textContent = "남기는 중...";

    try {
      const res = await fetch("/api/guestbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, message }),
      });
      const body = await res.json();

      if (!res.ok) {
        console.error("방명록 저장 실패:", body.error);
        if (gbStatus) gbStatus.textContent = body.error || "저장에 실패했어요. 잠시 후 다시 시도해 주세요.";
      } else {
        if (gbStatus) gbStatus.textContent = "남겨 주셔서 고마워요!";
        nameEl.value = "";
        msgEl.value = "";
        await loadGuestbook();
      }
    } catch (err) {
      console.error("방명록 저장 실패:", err.message);
      if (gbStatus) gbStatus.textContent = "저장에 실패했어요. 잠시 후 다시 시도해 주세요.";
    }
    if (gbSubmit) gbSubmit.disabled = false;
  }

  if (gbForm) {
    gbForm.addEventListener("submit", submitGuestbook);
    loadGuestbook();
  }
})();

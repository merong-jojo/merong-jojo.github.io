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

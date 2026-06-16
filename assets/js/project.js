/* ============================================================
   Project detail page — shared interactions.
   Reuses window.Chiptune (audio.js). Lightweight vs. main.js.
   ============================================================ */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const SND = window.Chiptune || null;

  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---- audio boot on first gesture ---- */
  let booted = false;
  function bootAudio() {
    if (booted || !SND) return;
    booted = true;
    SND.startMusic();
    sync();
  }
  ["pointerdown", "keydown", "touchstart"].forEach((ev) =>
    window.addEventListener(ev, bootAudio, { once: true }));

  function sync() {
    if (!SND) return;
    const m = $("#musicBtn"), s = $("#sfxBtn");
    if (m) m.classList.toggle("off", !SND.musicOn);
    if (s) s.classList.toggle("off", !SND.sfxOn);
  }
  const mBtn = $("#musicBtn"), sBtn = $("#sfxBtn");
  if (mBtn) mBtn.addEventListener("click", () => { if (SND) { SND.toggleMusic(); sync(); } });
  if (sBtn) sBtn.addEventListener("click", () => { if (SND) { SND.toggleSfx(); sync(); SND.click(); } });

  /* ---- interaction sounds ---- */
  $$(".ptags li, .pstack li, .ghud__btn, .pnav__back, .btn, .link").forEach((el) => {
    el.addEventListener("mouseenter", () => { if (SND) SND.hover(); });
  });
  $$(".btn, .pnav__back, .link").forEach((el) => {
    el.addEventListener("click", () => { if (SND) SND.coin(); });
  });

  /* ---- scroll reveal ---- */
  const revealEls = $$(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---- CRT toggle ---- */
  const crtBtn = $("#crtToggle");
  if (crtBtn) crtBtn.addEventListener("click", () => {
    const off = document.body.classList.toggle("crt-off");
    crtBtn.textContent = off ? "CRT: OFF" : "CRT: ON";
    if (SND) SND.click();
  });

  /* ---- floating pixel particles ---- */
  const canvas = $("#pollen");
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext("2d");
    let w, h, parts;
    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      const n = Math.min(40, Math.floor(w / 34));
      parts = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        s: 2 + Math.random() * 3, sp: 0.15 + Math.random() * 0.45,
        d: (Math.random() - 0.5) * 0.3, a: 0.2 + Math.random() * 0.4,
      }));
    }
    function color() { return getComputedStyle(document.documentElement).getPropertyValue("--lime").trim() || "#b7e02f"; }
    function draw() {
      ctx.clearRect(0, 0, w, h);
      const c = color();
      parts.forEach((p) => {
        p.y -= p.sp; p.x += p.d;
        if (p.y < -8) { p.y = h + 8; p.x = Math.random() * w; }
        ctx.globalAlpha = p.a; ctx.fillStyle = c;
        ctx.fillRect(p.x, p.y, p.s, p.s);
      });
      ctx.globalAlpha = 1;
      requestAnimationFrame(draw);
    }
    window.addEventListener("resize", resize);
    resize(); draw();
  }

  sync();
})();

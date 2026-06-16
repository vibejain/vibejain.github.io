/* ============================================================
   Retro scrollable portfolio — micro-interactions + GAMIFICATION
   Vanilla JS. Pairs with audio.js (window.Chiptune).
   ============================================================ */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const SND = window.Chiptune || null;

  /* ---- Footer year ---- */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ============================================================
     GAME STATE
     ============================================================ */
  const Game = {
    score: 0,
    level: 1,
    PER_LEVEL: 100,
    achievements: new Set(loadAchv()),

    add(points, x, y) {
      this.score += points;
      pointPop(points, x, y);
      const newLevel = Math.floor(this.score / this.PER_LEVEL) + 1;
      if (newLevel > this.level) { this.level = newLevel; levelUp(newLevel); }
      this.render();
    },

    render() {
      $("#score").textContent = String(this.score);
      $("#glevel").textContent = String(this.level);
      const into = this.score % this.PER_LEVEL;
      $("#gxp").style.width = (into / this.PER_LEVEL) * 100 + "%";
    },

    unlock(id, title, desc, points) {
      if (this.achievements.has(id)) return;
      this.achievements.add(id);
      saveAchv([...this.achievements]);
      showAchv(title, desc);
      if (SND) SND.powerup();
      this.add(points || 25);
    },
  };

  function loadAchv() {
    try { return JSON.parse(localStorage.getItem("retro.achv") || "[]"); }
    catch (e) { return []; }
  }
  function saveAchv(a) { try { localStorage.setItem("retro.achv", JSON.stringify(a)); } catch (e) {} }

  /* ---- floating "+N" popup ---- */
  function pointPop(n, x, y) {
    if (reduceMotion || x == null) return;
    const el = document.createElement("div");
    el.className = "point-pop";
    el.textContent = "+" + n;
    el.style.left = x + "px";
    el.style.top = y + "px";
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 900);
  }

  /* ---- achievement toast ---- */
  let achvTimer = null;
  function showAchv(title, desc) {
    const box = $("#achv");
    $("#achvTitle").textContent = title;
    $("#achvDesc").textContent = desc;
    box.classList.add("show");
    clearTimeout(achvTimer);
    achvTimer = setTimeout(() => box.classList.remove("show"), 3600);
  }

  /* ---- level up ---- */
  function levelUp(n) {
    const b = $("#levelup");
    $("#levelupNum").textContent = String(n);
    b.classList.remove("show"); void b.offsetWidth; b.classList.add("show");
    if (SND) SND.levelup();
    confetti();
    setTimeout(() => b.classList.remove("show"), 1700);
  }

  function confetti() {
    if (reduceMotion) return;
    const colors = ["#b7e02f", "#6a5acd", "#e06a3b", "#1f9eb8", "#ffd23f"];
    for (let i = 0; i < 70; i++) {
      const p = document.createElement("div");
      p.className = "confetti";
      p.style.left = Math.random() * 100 + "vw";
      p.style.background = colors[i % colors.length];
      p.style.animationDelay = Math.random() * 0.5 + "s";
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 3100);
    }
  }

  /* ============================================================
     AUDIO BOOTSTRAP (browsers need a user gesture)
     ============================================================ */
  let audioReady = false;
  function bootAudio() {
    if (audioReady || !SND) return;
    audioReady = true;
    SND.startMusic();
    $("#soundStart").classList.add("gone");
    syncAudioButtons();
  }
  ["pointerdown", "keydown", "touchstart"].forEach((ev) =>
    window.addEventListener(ev, bootAudio, { once: true }));
  const ss = $("#soundStart");
  if (ss) ss.addEventListener("click", bootAudio);

  function syncAudioButtons() {
    if (!SND) return;
    $("#musicBtn").classList.toggle("off", !SND.musicOn);
    $("#sfxBtn").classList.toggle("off", !SND.sfxOn);
  }
  $("#musicBtn").addEventListener("click", () => { if (SND) { SND.toggleMusic(); syncAudioButtons(); } });
  $("#sfxBtn").addEventListener("click", () => { if (SND) { SND.toggleSfx(); syncAudioButtons(); SND.click(); } });

  /* ============================================================
     INTERACTION → SOUND + POINTS
     ============================================================ */
  // Hover ticks on tags + skyline + buttons (debounced)
  let lastHover = 0;
  function hoverFx() {
    const now = performance.now();
    if (now - lastHover < 60) return;
    lastHover = now;
    if (SND) SND.hover();
  }
  $$(".tags li, .skyline img, .btn, .nav__links a, .link, .project").forEach((el) => {
    el.addEventListener("mouseenter", hoverFx);
  });

  /* Project cards: 3D tilt on mouse move + coin-then-navigate */
  $$(".project").forEach((card) => {
    if (!reduceMotion) {
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform =
          "perspective(700px) rotateY(" + (px * 8) + "deg) rotateX(" + (-py * 8) + "deg) translateY(-4px)";
      });
      card.addEventListener("mouseleave", () => { card.style.transform = ""; });
    }
    card.addEventListener("click", (e) => {
      const href = card.getAttribute("href");
      if (!href || e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      if (SND) SND.coin();
      Game.add(15, e.clientX, e.clientY);
      setTimeout(() => { window.location.href = href; }, 150);
    });
  });

  // Clicks on buttons / links → coin + points
  $$(".btn, .nav__links a, .link, .nav__logo").forEach((el) => {
    el.addEventListener("click", (e) => {
      if (SND) SND.coin();
      Game.add(10, e.clientX, e.clientY);
    });
  });

  // Clicking skill tags = collectible coins
  $$(".tags li").forEach((el) => {
    el.addEventListener("click", (e) => {
      if (SND) SND.coin();
      Game.add(5, e.clientX, e.clientY);
      el.style.background = "var(--lime)";
    });
  });

  /* ---- Typewriter ---- */
  const typeEl = $("#typewriter");
  if (typeEl && !reduceMotion) {
    const phrases = ["business outcomes.", "hours saved.", "shipped workflows.", "real revenue."];
    let p = 0, i = 0, deleting = false;
    function tick() {
      const word = phrases[p];
      typeEl.textContent = word.slice(0, i);
      if (!deleting && i < word.length) i++;
      else if (deleting && i > 0) i--;
      else if (!deleting && i === word.length) { deleting = true; return setTimeout(tick, 1500); }
      else { deleting = false; p = (p + 1) % phrases.length; }
      setTimeout(tick, deleting ? 45 : 90);
    }
    tick();
  }

  /* ---- Mobile hamburger ---- */
  const hamburger = $("#navHamburger");
  const navLinksEl = $("#navLinks");
  const mainNav = $("#mainNav");
  if (hamburger && navLinksEl) {
    hamburger.addEventListener("click", () => {
      const open = navLinksEl.classList.toggle("open");
      document.body.classList.toggle("nav-open", open);
      hamburger.innerHTML = open ? "&#10005;" : "&#9776;";
      hamburger.setAttribute("aria-expanded", String(open));
      if (SND) SND.click();
    });
    $$(".nav__links a").forEach((a) => {
      a.addEventListener("click", () => {
        navLinksEl.classList.remove("open");
        document.body.classList.remove("nav-open");
        hamburger.innerHTML = "&#9776;";
        hamburger.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---- Scroll progress + nav backdrop ---- */
  const fill = $("#progressFill");
  const navBackdrop = $("#navBackdrop");
  function onScroll() {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    if (fill) fill.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
    const scrolled = h.scrollTop > 60;
    if (navBackdrop) navBackdrop.classList.toggle("visible", scrolled);
    if (mainNav) mainNav.classList.toggle("scrolled", scrolled);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- Scroll reveal + "discovered section" achievement ---- */
  const SECTION_NAMES = { about: "Origin Story", skills: "Skill Tree", projects: "Loot Vault", contact: "Final Boss" };
  const revealEls = $$(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
      });
    }, { threshold: 0.14 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  // Section discovery → achievement
  const sectionEls = $$("section[id]");
  const discovered = new Set();
  if ("IntersectionObserver" in window) {
    const secIo = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !discovered.has(e.target.id)) {
          discovered.add(e.target.id);
          const id = e.target.id;
          const nm = SECTION_NAMES[id] || id;
          Game.unlock("sec_" + id, "Discovered: " + nm, "+25 XP for exploring", 25);
          if (discovered.size >= Object.keys(SECTION_NAMES).length) {
            Game.unlock("explorer", "World Explorer!", "You saw the whole page", 100);
          }
        }
      });
    }, { threshold: 0.4 });
    sectionEls.forEach((s) => secIo.observe(s));
  }

  /* ---- Scrollspy ---- */
  const spyLinks = $$("[data-spy]");
  const spySections = spyLinks.map((a) => $("#" + a.dataset.spy)).filter(Boolean);
  if ("IntersectionObserver" in window && spySections.length) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const id = e.target.id;
          spyLinks.forEach((a) => a.classList.toggle("is-active", a.dataset.spy === id));
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
    spySections.forEach((s) => spy.observe(s));
  }

  /* ---- CRT toggle (achievement) ---- */
  const crtBtn = $("#crtToggle");
  if (crtBtn) crtBtn.addEventListener("click", () => {
    const off = document.body.classList.toggle("crt-off");
    crtBtn.textContent = off ? "CRT: OFF" : "CRT: ON";
    if (SND) SND.click();
    Game.unlock("crt", "Time Traveler", "You toggled the CRT", 25);
  });

  /* ---- Logo: Shift+click palette easter egg (achievement) ---- */
  const logo = $("#logo");
  const palettes = [
    { lime: "#b7e02f", limeDeep: "#8fb81f", grape: "#6a5acd" },
    { lime: "#ff9f6b", limeDeep: "#e06a3b", grape: "#c44b8a" },
    { lime: "#5ad1e0", limeDeep: "#1f9eb8", grape: "#5a6acd" },
    { lime: "#e0c83a", limeDeep: "#b8941f", grape: "#8a5acd" },
  ];
  let pi = 0;
  if (logo) logo.addEventListener("click", (e) => {
    if (!e.shiftKey) return;
    e.preventDefault();
    pi = (pi + 1) % palettes.length;
    const t = palettes[pi], r = document.documentElement.style;
    r.setProperty("--lime", t.lime); r.setProperty("--lime-deep", t.limeDeep); r.setProperty("--grape", t.grape);
    if (SND) SND.secret();
    Game.unlock("reskin", "Re-Skinned", "Found the palette switcher", 30);
  });

  /* ---- Konami code → secret achievement ---- */
  const konami = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
  let kIdx = 0;
  window.addEventListener("keydown", (e) => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    kIdx = (key === konami[kIdx]) ? kIdx + 1 : 0;
    if (kIdx === konami.length) {
      kIdx = 0;
      document.body.classList.add("rainbow");
      if (SND) SND.secret();
      Game.unlock("konami", "↑↑↓↓←→←→BA", "You found the secret!", 100);
      confetti();
    }
  });

  /* ---- Floating pixel particles ---- */
  const canvas = $("#pollen");
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext("2d");
    let w, h, parts;
    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      const n = Math.min(50, Math.floor(w / 30));
      parts = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        s: 2 + Math.random() * 3, sp: 0.15 + Math.random() * 0.5,
        d: (Math.random() - 0.5) * 0.35, a: 0.25 + Math.random() * 0.4,
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

  /* ---- init ---- */
  Game.render();
  syncAudioButtons();
})();

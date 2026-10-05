(() => {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;

  const scrollGlow = document.getElementById("scroll-glow");

  /* ---------------- Split-text reveal (chars / words) ---------------- */

  function splitText(el) {
    const mode = el.getAttribute("data-split");
    const text = el.textContent.trim();
    el.setAttribute("aria-label", text);
    el.textContent = "";

    const words = text.split(" ");
    let i = 0;

    words.forEach((word, wi) => {
      if (mode === "words") {
        const span = document.createElement("span");
        span.className = "split-unit";
        span.style.setProperty("--i", i++);
        span.textContent = word;
        el.appendChild(span);
      } else {
        [...word].forEach((ch) => {
          const span = document.createElement("span");
          span.className = "split-unit";
          span.style.setProperty("--i", i++);
          span.textContent = ch;
          el.appendChild(span);
        });
      }
      if (wi < words.length - 1) {
        const space = document.createElement("span");
        space.className = "split-space";
        space.setAttribute("aria-hidden", "true");
        space.textContent = " ";
        el.appendChild(space);
      }
    });
  }

  document.querySelectorAll("[data-split]").forEach(splitText);

  /* ---------------- Smooth scroll buttons ---------------- */

  document.querySelectorAll("[data-scroll-to]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = document.querySelector(btn.getAttribute("data-scroll-to"));
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  /* ---------------- Reveal on scroll ---------------- */

  const revealEls = document.querySelectorAll(".reveal, .trust-words");

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            entry.target.querySelectorAll("[data-split]").forEach((el) => el.classList.add("in-view"));
          }
        });
      },
      { threshold: 0.35 }
    );
    revealEls.forEach((el) => observer.observe(el));
  } else {
    revealEls.forEach((el) => {
      el.classList.add("in-view");
      el.querySelectorAll("[data-split]").forEach((s) => s.classList.add("in-view"));
    });
  }

  /* ---------------- Per-page entrance marker ---------------- */

  const screens = document.querySelectorAll(".screen");

  if ("IntersectionObserver" in window) {
    const screenObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("in-view");
        });
      },
      { threshold: 0.18 }
    );
    screens.forEach((s) => screenObserver.observe(s));
  } else {
    screens.forEach((s) => s.classList.add("in-view"));
  }

  /* ---------------- iOS :active fix (enables tap feedback on touch) ---------------- */

  document.addEventListener("touchstart", () => {}, { passive: true });

  /* ---------------- Custom cursor ---------------- */

  function initCursor() {
    if (isCoarsePointer) return;

    const dot = document.getElementById("cursor-dot");
    const ring = document.getElementById("cursor-ring");
    if (!dot || !ring) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;
    let activated = false;

    window.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!activated) {
        activated = true;
        document.body.classList.add("has-cursor");
      }

      dot.style.left = `${mouseX}px`;
      dot.style.top = `${mouseY}px`;

      if (scrollGlow) {
        scrollGlow.style.setProperty("--sx", `${(mouseX / window.innerWidth) * 100}%`);
        scrollGlow.style.setProperty("--sy", `${(mouseY / window.innerHeight) * 100}%`);
        if (!prefersReducedMotion) scrollGlow.classList.add("visible");
      }
    });

    function tick() {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      ring.style.left = `${ringX}px`;
      ring.style.top = `${ringY}px`;
      requestAnimationFrame(tick);
    }
    tick();

    const hoverSelector = "a, button, [data-tilt], .magnetic, .word, .wax-seal, .progress-dot";
    document.addEventListener("mouseover", (e) => {
      if (e.target.closest && e.target.closest(hoverSelector)) ring.classList.add("hovering");
    });
    document.addEventListener("mouseout", (e) => {
      if (e.target.closest && e.target.closest(hoverSelector)) ring.classList.remove("hovering");
    });
  }

  /* ---------------- Magnetic buttons ---------------- */

  function initMagnetic() {
    if (isCoarsePointer || prefersReducedMotion) return;

    document.querySelectorAll(".magnetic").forEach((btn) => {
      const strength = 0.3;
      btn.addEventListener("mousemove", (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
      });
      btn.addEventListener("mouseleave", () => {
        btn.style.transform = "";
      });
    });
  }

  /* ---------------- Tilt cards + cursor-follow sheen ---------------- */

  function initTilt() {
    if (isCoarsePointer || prefersReducedMotion) return;

    document.querySelectorAll("[data-tilt]").forEach((card) => {
      const maxTilt = 7;

      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;
        const rotateY = (px - 0.5) * maxTilt * 2;
        const rotateX = (0.5 - py) * maxTilt * 2;

        card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.015, 1.015, 1.015)`;
        card.style.setProperty("--mx", `${px * 100}%`);
        card.style.setProperty("--my", `${py * 100}%`);

        if (card.classList.contains("float-card")) card.classList.add("tilting");
      });

      card.addEventListener("mouseleave", () => {
        card.style.transform = "";
        card.classList.remove("tilting");
      });
    });
  }

  /* ---------------- Progress rail + section nav ---------------- */

  function initProgressNav() {
    const dots = Array.from(document.querySelectorAll(".progress-dot"));
    const fill = document.getElementById("progress-fill");
    if (!dots.length || !fill) return;

    const sections = dots
      .map((dot) => document.querySelector(dot.getAttribute("data-target")))
      .filter(Boolean);

    dots.forEach((dot) => {
      dot.addEventListener("click", () => {
        const target = document.querySelector(dot.getAttribute("data-target"));
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    function updateFill() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      fill.style.width = `${pct}%`;
    }

    if ("IntersectionObserver" in window) {
      const navObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const idx = sections.indexOf(entry.target);
            if (idx === -1 || !entry.isIntersecting) return;
            dots.forEach((d) => d.classList.remove("active"));
            dots[idx].classList.add("active");
          });
        },
        { threshold: 0.5 }
      );
      sections.forEach((s) => navObserver.observe(s));
    }

    window.addEventListener("scroll", updateFill, { passive: true });
    updateFill();
  }

  /* ---------------- Interactive breathing guide (screen 2) ---------------- */

  function initBreathingGuide() {
    const toggle = document.getElementById("breathe-toggle");
    const label = document.getElementById("breathe-btn-label");
    const cue = document.getElementById("breathe-cue");
    const circle = document.getElementById("breathing-circle");
    const ring = document.querySelector(".breathing-ring");
    const ringProgress = document.getElementById("breathing-ring-progress");
    if (!toggle || !circle || !ring || !ringProgress) return;

    const CIRC = 578;
    const cycle = [
      { text: "Breathe in…", duration: 4000, scale: 1.18 },
      { text: "Hold.", duration: 3000, scale: 1.18 },
      { text: "Breathe out…", duration: 6000, scale: 0.82 },
    ];
    const totalMs = cycle.reduce((sum, step) => sum + step.duration, 0);

    let active = false;
    let timer = null;

    function startRing() {
      ringProgress.style.transition = "none";
      ringProgress.style.strokeDashoffset = String(CIRC);
      void ringProgress.getBoundingClientRect();
      ringProgress.style.transition = `stroke-dashoffset ${totalMs}ms linear`;
      requestAnimationFrame(() => {
        ringProgress.style.strokeDashoffset = "0";
      });
    }

    function runCycle(stepIndex) {
      if (!active) return;
      const step = cycle[stepIndex];

      cue.textContent = step.text;
      cue.classList.add("visible");
      circle.style.transitionDuration = `${step.duration}ms`;
      circle.style.transform = `scale(${step.scale})`;
      circle.style.opacity = "0.6";

      if (stepIndex === 0) startRing();

      timer = setTimeout(() => {
        runCycle((stepIndex + 1) % cycle.length);
      }, step.duration);
    }

    toggle.addEventListener("click", () => {
      active = !active;
      toggle.classList.toggle("active", active);
      toggle.setAttribute("aria-pressed", String(active));

      if (active) {
        label.textContent = "Pause";
        circle.style.animation = "none";
        circle.style.transition = `transform ${cycle[0].duration}ms var(--ease), opacity ${cycle[0].duration}ms var(--ease)`;
        ring.classList.add("active");
        runCycle(0);
      } else {
        label.textContent = "Breathe with me";
        clearTimeout(timer);
        cue.classList.remove("visible");
        ring.classList.remove("active");
        circle.style.animation = "";
        circle.style.transition = "";
        circle.style.transform = "";
        circle.style.opacity = "";
        ringProgress.style.transition = "none";
        ringProgress.style.strokeDashoffset = String(CIRC);
      }
    });
  }

  /* ---------------- Trust word reveals (screen 6) ---------------- */

  function initTrustWords() {
    const words = document.querySelectorAll(".trust-words .word");
    const meaning = document.getElementById("word-meaning");
    if (!words.length || !meaning) return;

    words.forEach((word) => {
      word.addEventListener("click", () => {
        const isOpen = word.getAttribute("aria-expanded") === "true";
        words.forEach((w) => w.setAttribute("aria-expanded", "false"));

        if (isOpen) {
          meaning.classList.remove("visible");
        } else {
          word.setAttribute("aria-expanded", "true");
          meaning.textContent = word.getAttribute("data-meaning");
          meaning.classList.add("visible");
        }
      });
    });
  }

  /* ---------------- Wax seal letters (screens 12 & 14) ---------------- */

  function initWaxSeal() {
    document.querySelectorAll(".wax-seal").forEach((seal) => {
      const envelope = seal.closest(".letter-envelope");
      const card = envelope && envelope.querySelector(".letter-card");
      if (!envelope || !card) return;

      seal.addEventListener("click", () => {
        envelope.classList.add("opened");
        seal.setAttribute("aria-expanded", "true");

        const screen = envelope.closest(".screen");
        if (screen) screen.classList.add("bright-open");

        const h = card.scrollHeight;
        card.style.maxHeight = `${h}px`;
        setTimeout(() => {
          card.style.maxHeight = "none";
        }, 1300);

        if (seal.id === "propose-seal") {
          const rect = seal.getBoundingClientRect();
          spawnSparkBurst(document.getElementById("spark-field"), 36, {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
          });
        }
      });
    });
  }

  /* ---------------- Spark burst (screen 14) ---------------- */

  function spawnSparkBurst(field, count, origin) {
    if (!field || prefersReducedMotion) return;

    const originX = origin ? origin.x : window.innerWidth / 2;
    const originY = origin ? origin.y : window.innerHeight / 2;

    for (let i = 0; i < count; i++) {
      const span = document.createElement("span");
      const angle = Math.random() * Math.PI * 2;
      const distance = 120 + Math.random() * 260;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;
      const duration = 1 + Math.random() * 0.9;

      span.style.left = `${originX}px`;
      span.style.top = `${originY}px`;
      span.style.setProperty("--tx", `${tx}px`);
      span.style.setProperty("--ty", `${ty}px`);
      span.style.animationDuration = `${duration}s`;
      span.style.animationDelay = `${Math.random() * 0.15}s`;

      field.appendChild(span);
      setTimeout(() => span.remove(), (duration + 0.2) * 1000);
    }
  }

  function initProposeHeart() {
    const heart = document.getElementById("propose-heart");
    const field = document.getElementById("spark-field");
    if (!heart) return;

    heart.addEventListener("click", () => {
      heart.classList.remove("pulsing");
      void heart.offsetWidth;
      heart.classList.add("pulsing");

      const rect = heart.getBoundingClientRect();
      spawnSparkBurst(field, 20, {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
    });
  }

  /* ---------------- Ember particles (screen 11) ---------------- */

  const emberField = document.getElementById("ember-field");

  function spawnEmbers(field, count) {
    for (let i = 0; i < count; i++) {
      const span = document.createElement("span");
      const left = Math.random() * 100;
      const duration = 6 + Math.random() * 6;
      const delay = Math.random() * 4;
      span.style.left = `${left}%`;
      span.style.animationDuration = `${duration}s`;
      span.style.animationDelay = `${delay}s`;
      field.appendChild(span);
    }
  }

  if (emberField && !prefersReducedMotion) {
    const emberObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !emberField.classList.contains("active")) {
            spawnEmbers(emberField, 26);
            emberField.classList.add("active");
          }
        });
      },
      { threshold: 0.3 }
    );
    emberObserver.observe(emberField);

    if (!isCoarsePointer) {
      let lastSpawn = 0;
      emberField.parentElement.addEventListener("mousemove", (e) => {
        const now = Date.now();
        if (now - lastSpawn < 140) return;
        lastSpawn = now;

        const rect = emberField.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const span = document.createElement("span");
        span.style.left = `${x}%`;
        span.style.animationDuration = `${4 + Math.random() * 3}s`;
        emberField.classList.add("active");
        emberField.appendChild(span);
        setTimeout(() => span.remove(), 8000);
      });
    }
  }

  /* ---------------- Final light interaction (screen 13) ---------------- */

  function initFinalLight() {
    const light = document.getElementById("final-light");
    if (!light) return;

    light.addEventListener("click", () => {
      light.classList.remove("rippling");
      void light.offsetWidth;
      light.classList.add("rippling");
    });
  }

  /* ---------------- Background particle field ---------------- */

  const canvas = document.getElementById("particle-canvas");

  if (canvas && !prefersReducedMotion) {
    const ctx = canvas.getContext("2d");
    let width, height, particles;
    const PARTICLE_COUNT = isCoarsePointer ? 44 : 70;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function makeParticles() {
      particles = Array.from({ length: PARTICLE_COUNT }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.4 + 0.3,
        speed: Math.random() * 0.18 + 0.03,
        drift: (Math.random() - 0.5) * 0.08,
        alpha: Math.random() * 0.4 + 0.1,
        twinkle: Math.random() * Math.PI * 2,
      }));
    }

    function tick() {
      ctx.clearRect(0, 0, width, height);
      particles.forEach((p) => {
        p.y -= p.speed;
        p.x += p.drift;
        p.twinkle += 0.01;
        if (p.y < -5) {
          p.y = height + 5;
          p.x = Math.random() * width;
        }
        if (p.x < -5) p.x = width + 5;
        if (p.x > width + 5) p.x = -5;

        const flicker = (Math.sin(p.twinkle) + 1) / 2;
        const alpha = p.alpha * (0.5 + flicker * 0.5);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(201, 165, 104, ${alpha})`;
        ctx.fill();
      });
      requestAnimationFrame(tick);
    }

    resize();
    makeParticles();
    tick();

    window.addEventListener("resize", () => {
      resize();
      makeParticles();
    });
  }

  /* ---------------- Ambient music toggle ---------------- */

  const musicToggle = document.getElementById("music-toggle");
  const iconPlay = musicToggle.querySelector(".icon-play");
  const iconPause = musicToggle.querySelector(".icon-pause");
  const musicLabel = musicToggle.querySelector(".music-label");

  let audioCtx = null;
  let isPlaying = false;
  let masterGain = null;

  function buildAmbientPad() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0;
    masterGain.connect(audioCtx.destination);

    const filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 900;
    filter.connect(masterGain);

    const freqs = [130.81, 164.81, 196.0];
    freqs.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;

      const oscGain = audioCtx.createGain();
      oscGain.gain.value = 0.18 / freqs.length;

      const lfo = audioCtx.createOscillator();
      lfo.frequency.value = 0.05 + i * 0.02;
      const lfoGain = audioCtx.createGain();
      lfoGain.gain.value = 4;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      osc.connect(oscGain);
      oscGain.connect(filter);

      osc.start();
      lfo.start();
    });
  }

  function toggleMusic() {
    if (!audioCtx) buildAmbientPad();
    if (audioCtx.state === "suspended") audioCtx.resume();

    isPlaying = !isPlaying;
    const now = audioCtx.currentTime;

    if (isPlaying) {
      masterGain.gain.cancelScheduledValues(now);
      masterGain.gain.setValueAtTime(masterGain.gain.value, now);
      masterGain.gain.linearRampToValueAtTime(1, now + 2.5);
    } else {
      masterGain.gain.cancelScheduledValues(now);
      masterGain.gain.setValueAtTime(masterGain.gain.value, now);
      masterGain.gain.linearRampToValueAtTime(0, now + 1.5);
    }

    iconPlay.hidden = isPlaying;
    iconPause.hidden = !isPlaying;
    musicLabel.textContent = isPlaying ? "pause" : "sound";
    musicToggle.classList.toggle("playing", isPlaying);
    musicToggle.setAttribute("aria-pressed", String(isPlaying));
    musicToggle.setAttribute("aria-label", isPlaying ? "Pause ambient music" : "Play ambient music");
  }

  musicToggle.addEventListener("click", toggleMusic);

  /* ---------------- Screen 15: Read again / Close ---------------- */

  const readAgainBtn = document.getElementById("read-again");
  const closeBtn = document.getElementById("close-letter");
  const goodnightOverlay = document.getElementById("goodnight-overlay");

  if (readAgainBtn) {
    readAgainBtn.addEventListener("click", () => {
      document.getElementById("top").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  if (closeBtn && goodnightOverlay) {
    closeBtn.addEventListener("click", () => {
      goodnightOverlay.classList.add("visible");
      goodnightOverlay.setAttribute("aria-hidden", "false");
    });
  }

  /* ---------------- Init ---------------- */

  initCursor();
  initMagnetic();
  initTilt();
  initProgressNav();
  initBreathingGuide();
  initTrustWords();
  initWaxSeal();
  initFinalLight();
  initProposeHeart();
})();

(() => {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
          }
        });
      },
      { threshold: 0.35 }
    );
    revealEls.forEach((el) => observer.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("in-view"));
  }

  /* ---------------- Ember particles (screen 11) ---------------- */

  const emberField = document.querySelector(".ember-field");
  if (emberField && !prefersReducedMotion) {
    const emberObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !emberField.classList.contains("active")) {
            spawnEmbers(emberField);
            emberField.classList.add("active");
          }
        });
      },
      { threshold: 0.3 }
    );
    emberObserver.observe(emberField);
  }

  function spawnEmbers(field) {
    const count = 26;
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

  /* ---------------- Background particle field ---------------- */

  const canvas = document.getElementById("particle-canvas");

  if (canvas && !prefersReducedMotion) {
    const ctx = canvas.getContext("2d");
    let width, height, particles;
    const PARTICLE_COUNT = 70;

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
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
  let oscillators = [];

  function buildAmbientPad() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0;
    masterGain.connect(audioCtx.destination);

    const filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 900;
    filter.connect(masterGain);

    const freqs = [130.81, 164.81, 196.0]; // soft C3 major-ish pad
    oscillators = freqs.map((freq, i) => {
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
      return osc;
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
    musicToggle.setAttribute("aria-pressed", String(isPlaying));
    musicToggle.setAttribute("aria-label", isPlaying ? "Pause ambient music" : "Play ambient music");
  }

  musicToggle.addEventListener("click", toggleMusic);

  /* ---------------- Screen 14: Read again / Close ---------------- */

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
})();

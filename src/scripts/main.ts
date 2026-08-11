import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type RGB = [number, number, number];
const $ = <T extends Element = Element>(selector: string) =>
  document.querySelector<T>(selector);
const $$ = <T extends Element = Element>(selector: string) =>
  Array.from(document.querySelectorAll<T>(selector));

const body = document.body;
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const coarse = window.matchMedia("(pointer: coarse)").matches;

const initTheme = (): void => {
  const theme = $("#theme");
  const saved = localStorage.getItem("pratham-theme");
  if (saved === "light") body.classList.add("light");
  theme?.addEventListener("click", () => {
    body.classList.toggle("light");
    localStorage.setItem(
      "pratham-theme",
      body.classList.contains("light") ? "light" : "dark",
    );
  });
};

const initMobileNav = (): void => {
  const mobile = $("#mobile");
  const menu = $("#menu");
  if (!mobile || !menu) return;

  const source = $$(".links a").map(
    (link) => link.cloneNode(true) as HTMLAnchorElement,
  );
  source.forEach((link) => mobile.append(link));

  menu.addEventListener("click", () => {
    const open = mobile.classList.toggle("open");
    menu.setAttribute("aria-expanded", String(open));
  });

  mobile.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => mobile.classList.remove("open"));
  });
};

const initAnchors = (): void => {
  $$<HTMLAnchorElement>('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      const id = anchor.getAttribute("href");
      const target = id ? document.querySelector(id) : null;
      if (!target || id === "#") return;
      event.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 92;
      window.scrollTo({ top, behavior: reduced ? "auto" : "smooth" });
    });
  });
};

const initScroll = (): void => {
  const progress = $("#progress");
  const top = $("#top");
  if (!progress) return;

  const update = (): void => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = `${max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0}%`;
    top?.classList.toggle("show", window.scrollY > 520);
  };

  let raf = 0;
  const onScroll = (): void => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      update();
      raf = 0;
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", update, { passive: true });
  update();
  top?.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" }),
  );
};

const initGsapMotion = (): void => {
  const reveals = $$(".reveal");
  if (reduced) return;

  gsap.set(reveals, { autoAlpha: 1, y: 0 });
  reveals.forEach((element) => {
    gsap.fromTo(
      element,
      { autoAlpha: 0, y: 24 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.75,
        ease: "power2.out",
        scrollTrigger: {
          trigger: element,
          start: "clamp(top 88%)",
          once: true,
        },
      },
    );
  });

  $$(".stagger").forEach((group) => {
    const items = Array.from(group.children);
    gsap.set(items, { autoAlpha: 1, y: 0 });
    gsap.fromTo(
      items,
      { autoAlpha: 0, y: 18 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.55,
        stagger: 0.07,
        ease: "power2.out",
        scrollTrigger: {
          trigger: group,
          start: "clamp(top 90%)",
          once: true,
        },
      },
    );
  });

  const hero = $(".hero");
  if (hero && !coarse) {
    gsap.to(hero.querySelectorAll("[data-depth]"), {
      y: (index) => (index % 2 ? -28 : 18),
      ease: "none",
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        end: "bottom top",
        scrub: 0.6,
      },
    });
  }
};

const initActiveNav = (): void => {
  const sections = $$<HTMLElement>("main section[id]");
  const links = $$(".links a");
  if (!sections.length || !links.length || !("IntersectionObserver" in window))
    return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((link) =>
          link.classList.toggle(
            "active",
            link.getAttribute("href") === `#${entry.target.id}`,
          ),
        );
      });
    },
    { rootMargin: "-42% 0px -48%" },
  );
  sections.forEach((section) => observer.observe(section));
};

const initPointerEffects = (): void => {
  if (reduced || !window.matchMedia("(pointer: fine)").matches) return;
  const cursor = $("#cursor");
  const ring = $("#cursorRing");
  if (!cursor || !ring) return;

  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;
  let rx = x;
  let ry = y;
  window.addEventListener(
    "pointermove",
    (event) => {
      x = event.clientX;
      y = event.clientY;
      cursor.style.left = `${x}px`;
      cursor.style.top = `${y}px`;
    },
    { passive: true },
  );

  const follow = (): void => {
    rx += (x - rx) * 0.14;
    ry += (y - ry) * 0.14;
    ring.style.left = `${rx}px`;
    ring.style.top = `${ry}px`;
    requestAnimationFrame(follow);
  };
  follow();

  const cards = $$(
    ".skill,.award,.cert,.project-mini,.project-main,.contact-cta",
  );
  cards.forEach((card) => {
    card.addEventListener("mouseenter", () => ring.classList.add("big"));
    card.addEventListener("mouseleave", () => ring.classList.remove("big"));
    card.addEventListener("pointermove", (event) => {
      const box = card.getBoundingClientRect();
      const px = (event.clientX - box.left) / box.width - 0.5;
      const py = (event.clientY - box.top) / box.height - 0.5;
      gsap.to(card, {
        rotateX: -py * 3,
        rotateY: px * 4,
        y: -4,
        duration: 0.25,
        overwrite: true,
      });
    });
    card.addEventListener("pointerleave", () =>
      gsap.to(card, {
        rotateX: 0,
        rotateY: 0,
        y: 0,
        duration: 0.35,
        overwrite: true,
      }),
    );
  });
};

const initTouchFeedback = (): void => {
  if (reduced || !coarse) return;
  $$(
    ".panel,.skill,.award,.cert,.project-mini,.project-main,.contact-cta",
  ).forEach((card) => {
    card.addEventListener(
      "pointerdown",
      () => card.classList.add("touch-active"),
      { passive: true },
    );
    ["pointerup", "pointercancel", "pointerleave"].forEach((type) => {
      card.addEventListener(type, () => card.classList.remove("touch-active"), {
        passive: true,
      });
    });
  });
};

const initCounters = (): void => {
  if (reduced) return;
  const metricSection = $("#about .numbers");
  if (!metricSection || !("IntersectionObserver" in window)) return;
  const values = $$("#about .number b").map(
    (el) => el.textContent?.trim() ?? "",
  );
  const animate = (): void => {
    $$("#about .number b").forEach((element, index) => {
      const match = values[index]?.match(/^([\d.]+)([+%]?)$/);
      if (!match) return;
      const target = Number(match[1]);
      const suffix = match[2];
      gsap.fromTo(
        element,
        { textContent: 0 },
        {
          textContent: target,
          duration: 0.9,
          ease: "power2.out",
          snap: { textContent: target % 1 ? 0.01 : 1 },
          onUpdate: () => {
            element.textContent = `${element.textContent ?? 0}${suffix}`;
          },
          onComplete: () => {
            element.textContent = `${target}${suffix}`;
          },
        },
      );
    });
  };
  ScrollTrigger.create({
    trigger: metricSection,
    start: "clamp(top 80%)",
    once: true,
    onEnter: animate,
  });
};

const initNetwork = (): void => {
  const canvas = $("#network") as HTMLCanvasElement | null;
  const ctx = canvas?.getContext("2d");
  if (!canvas || !ctx) return;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let last = performance.now();
  let pulse = 0;
  let nodes: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    r: number;
    phase: number;
  }> = [];

  const palette = (): { a: RGB; b: RGB; c: RGB } =>
    body.classList.contains("light")
      ? { a: [93, 80, 216], b: [0, 124, 157], c: [192, 68, 145] }
      : { a: [139, 124, 255], b: [85, 217, 255], c: [255, 122, 200] };

  const resize = (): void => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const seed = (): void => {
    const count = width < 700 ? 18 : width < 1100 ? 36 : 62;
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      r: 0.7 + Math.random() * 1.8,
      phase: Math.random() * Math.PI * 2,
    }));
  };

  const draw = (now: number): void => {
    if (document.hidden || reduced) return;
    const dt = Math.min(32, now - last);
    last = now;
    pulse += dt * 0.00055;
    ctx.clearRect(0, 0, width, height);
    const p = palette();

    for (let k = 0; k < 3; k += 1) {
      ctx.beginPath();
      for (let x = -40; x <= width + 40; x += 18) {
        const y =
          height * (0.2 + k * 0.29) +
          Math.sin(x * 0.006 + pulse * (1.2 + k * 0.25) + k) * 22 +
          Math.sin(x * 0.014 - pulse * 0.7) * 9;
        if (x === -40) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, `rgba(${p.a.join(",")},0)`);
      gradient.addColorStop(0.5, `rgba(${p.b.join(",")},.055)`);
      gradient.addColorStop(1, `rgba(${p.c.join(",")},0)`);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    nodes.forEach((node) => {
      node.x += node.vx * dt * 0.06;
      node.y += node.vy * dt * 0.06;
      node.phase += dt * 0.001;
      if (node.x < -10) node.x = width + 10;
      if (node.x > width + 10) node.x = -10;
      if (node.y < -10) node.y = height + 10;
      if (node.y > height + 10) node.y = -10;
      const glow = 0.55 + 0.35 * Math.sin(node.phase);
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.c.join(",")},${0.16 + 0.18 * glow})`;
      ctx.fill();
    });

    const maxDistance = width < 700 ? 100 : width < 1100 ? 125 : 155;
    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const a = nodes[i];
        const b = nodes[j];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        if (distance >= maxDistance) continue;
        const alpha = (1 - distance / maxDistance) * 0.11;
        ctx.strokeStyle = `rgba(${p.b.join(",")},${alpha})`;
        ctx.lineWidth = 0.55;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    requestAnimationFrame(draw);
  };

  resize();
  seed();
  window.addEventListener(
    "resize",
    () => {
      resize();
      seed();
    },
    { passive: true },
  );
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && !reduced) {
      last = performance.now();
      requestAnimationFrame(draw);
    }
  });
  requestAnimationFrame(draw);
};

const init = (): void => {
  initTheme();
  initMobileNav();
  initAnchors();
  initScroll();
  initGsapMotion();
  initActiveNav();
  initPointerEffects();
  initTouchFeedback();
  initCounters();
  initNetwork();
  body.classList.remove("loading");
};

if (document.readyState === "loading")
  document.addEventListener("DOMContentLoaded", init, { once: true });
else init();

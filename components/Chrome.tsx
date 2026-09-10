'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, Mail, Menu, X, ArrowUp } from 'lucide-react';
import { GithubIcon, LinkedinIcon } from '@/components/brand';
import { SITE, CHAPTERS } from '@/lib/site';
import { reducedMotion, scrollToId } from '@/lib/anim';

gsap.registerPlugin(ScrollTrigger);

/* ============================== PRELOADER ========================== */

const LOADER_STAGES = [
  'INITIALIZING PORTFOLIO...',
  'LOADING EXPERIENCE...',
  'LOADING PROJECTS...',
  'ESTABLISHING CONNECTION...',
  'READY.',
];

export function Preloader() {
  const [pct, setPct] = useState(0);
  const [stage, setStage] = useState(0);
  const [wiping, setWiping] = useState(false);
  const [gone, setGone] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const fired = useRef(false);

  const finish = useCallback(() => {
    if (fired.current) return;
    fired.current = true;
    setPct(100);
    setStage(4);
    window.setTimeout(() => {
      setWiping(true);
      window.dispatchEvent(new Event('portfolio:ready'));
      if (overlayRef.current && !reducedMotion) {
        gsap.to(overlayRef.current, {
          yPercent: -100,
          duration: 0.75,
          ease: 'power4.inOut',
          delay: 0.35,
          onComplete: () => setGone(true),
        });
      } else {
        window.setTimeout(() => setGone(true), 400);
      }
    }, reducedMotion ? 50 : 350);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      finish();
      return;
    }
    const obj = { v: 0 };
    const tl = gsap.timeline();
    tl.to(obj, {
      v: 100,
      duration: 1.8,
      ease: 'power2.inOut',
      onUpdate: () => setPct(Math.round(obj.v)),
    });
    tl.call(() => setStage(1), undefined, 0.55);
    tl.call(() => setStage(2), undefined, 1.05);
    tl.call(() => setStage(3), undefined, 1.55);
    tl.call(finish, undefined, 2.15);
    return () => {
      tl.kill();
    };
  }, [finish]);

  if (gone) return null;

  return (
    <div
      ref={overlayRef}
      className={`preloader select-none ${wiping ? 'pointer-events-none' : ''}`}
      onClick={finish}
      aria-hidden
    >
      <div className="flex w-[min(560px,84vw)] flex-col items-start">
        <div className="font-display text-3xl font-semibold tracking-[0.32em] text-snow md:text-4xl">
          ANUGRAH
        </div>
        <div className="mono-sm mt-3">COMPUTER SCIENCE • WEB • AI • BUILDING</div>
        <div className="mt-10 h-px w-full bg-white/10">
          <div
            className="preloader-line-fill h-px bg-electric"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-4 flex w-full items-center justify-between">
          <span className="mono-sm">{LOADER_STAGES[stage]}</span>
          <span className="font-mono text-xs text-electric-soft tabular-nums">{pct}%</span>
        </div>
      </div>
    </div>
  );
}

/* ============================== CURSOR ============================= */

export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    const dot = dotRef.current!;
    const ring = ringRef.current!;
    const label = labelRef.current!;
    document.documentElement.classList.add('no-native-cursor');

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let rx = x;
    let ry = y;
    let visible = false;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!visible) {
        visible = true;
        dot.style.opacity = '1';
        ring.style.opacity = '1';
      }
    };
    const onLeave = () => {
      visible = false;
      dot.style.opacity = '0';
      ring.style.opacity = '0';
    };
    const onDown = () => ring.classList.add('is-down');
    const onUp = () => ring.classList.remove('is-down');

    const onOver = (e: MouseEvent) => {
      const t = (e.target as HTMLElement).closest('a, button, [data-cursor]');
      if (t) {
        const kind = t.getAttribute('data-cursor') || (t.tagName === 'A' ? 'open' : '');
        label.textContent = kind.toUpperCase();
        ring.classList.toggle('is-label', kind.length > 0);
      } else {
        ring.classList.remove('is-label');
      }
    };

    const loop = () => {
      rx += (x - rx) * 0.16;
      ry += (y - ry) * 0.16;
      dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', onLeave);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    document.addEventListener('mouseover', onOver);
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      document.removeEventListener('mouseover', onOver);
      document.documentElement.classList.remove('no-native-cursor');
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="cursor-dot" aria-hidden />
      <div ref={ringRef} className="cursor-ring" aria-hidden>
        <span ref={labelRef} />
      </div>
    </>
  );
}

/* ============================ BACKGROUND ============================ */

export function BackgroundFX() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    const particles: { x: number; y: number; vx: number; vy: number; r: number; a: number }[] = [];
    const mouse = { x: -9999, y: -9999, sx: -9999, sy: -9999 };
    let skew = 0;
    let skewTarget = 0;
    let raf = 0;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const N = reducedMotion ? 0 : 64;
    for (let i = 0; i < N; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.16,
        vy: (Math.random() - 0.5) * 0.16,
        r: Math.random() * 1.6 + 0.4,
        a: Math.random() * 0.4 + 0.15,
      });
    }

    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener('mousemove', onMove);

    // chapter-driven grid warp
    const warpSts: ScrollTrigger[] = [];
    document.querySelectorAll<HTMLElement>('[data-chapter]').forEach((sec, i) => {
      const dir = i % 2 === 0 ? 1 : -1;
      const st = ScrollTrigger.create({
        trigger: sec,
        start: 'top 60%',
        onEnter: () => {
          skewTarget = dir * 0.02;
        },
        onEnterBack: () => {
          skewTarget = dir * 0.02;
        },
      });
      warpSts.push(st);
    });

    let scrollY = 0;
    const onScroll = () => {
      scrollY = window.scrollY;
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      skew += (skewTarget - skew) * 0.03;
      mouse.sx += (mouse.x - mouse.sx) * 0.08;
      mouse.sy += (mouse.y - mouse.sy) * 0.08;

      // fine technical grid
      const gap = 96;
      const off = (scrollY * 0.06) % gap;
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.transform(1, 0, skew, 1, 0, 0);
      ctx.translate(-w / 2, -h / 2);
      ctx.strokeStyle = 'rgba(138, 182, 255, 0.05)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = -off; x < w + gap; x += gap) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
      }
      for (let y = -off; y < h + gap; y += gap) {
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }
      ctx.stroke();
      ctx.restore();

      // vignette to keep edges quiet
      const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.75);
      vg.addColorStop(0, 'rgba(5, 7, 12, 0)');
      vg.addColorStop(1, 'rgba(5, 7, 12, 0.9)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, w, h);

      // cursor glow
      if (mouse.sx > -100) {
        const g = ctx.createRadialGradient(mouse.sx, mouse.sy, 0, mouse.sx, mouse.sy, 320);
        g.addColorStop(0, 'rgba(63, 140, 255, 0.055)');
        g.addColorStop(1, 'rgba(63, 140, 255, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(mouse.sx - 320, mouse.sy - 320, 640, 640);
      }

      // particles with local cursor distortion
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const d = Math.hypot(dx, dy);
        if (d < 150 && d > 0.01) {
          const f = ((150 - d) / 150) * 0.7;
          p.x += (dx / d) * f;
          p.y += (dy / d) * f;
        }
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(138, 182, 255, ${p.a})`;
        ctx.fill();
      }

      if (!reducedMotion && !document.hidden) raf = requestAnimationFrame(draw);
    };
    draw();

    const onVis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && !reducedMotion) raf = requestAnimationFrame(draw);
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVis);
      warpSts.forEach((t) => t.kill());
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0"
      style={{ background: 'transparent' }}
      aria-hidden
    />
  );
}

/* =============================== NAV ================================ */

const NAV_LINKS = [
  { label: 'WORK', id: 'work' },
  { label: 'ABOUT', id: 'about' },
  { label: 'LAB', id: 'lab' },
  { label: 'CONTACT', id: 'contact' },
];

const MENU_LINKS = [
  { label: 'ABOUT', id: 'about' },
  { label: 'SKILLS', id: 'lab' },
  { label: 'IDAM', id: 'work' },
  { label: 'CERTIFICATIONS', id: 'certifications' },
  { label: 'GITHUB', id: 'github' },
  { label: 'CONTACT', id: 'contact' },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const go = (id: string) => {
    setOpen(false);
    window.setTimeout(() => scrollToId(id), open ? 250 : 0);
  };

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-[80] transition-all duration-500 ${
          scrolled
            ? 'border-b border-white/5 bg-ink/70 backdrop-blur-xl'
            : 'bg-transparent'
        }`}
      >
        <nav
          className={`mx-auto flex w-full max-w-[1400px] items-center justify-between px-5 md:px-10 transition-all duration-500 ${
            scrolled ? 'py-3' : 'py-5 md:py-7'
          }`}
        >
          <button
            onClick={() => go('top')}
            className="flex items-baseline gap-2"
            aria-label="Back to top"
          >
            <span className="font-display text-lg font-semibold tracking-[0.22em] text-snow">
              ANUGRAH
            </span>
            <span className="mono-sm hidden sm:inline">/26</span>
          </button>

          <div className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((l) => (
              <button
                key={l.label}
                onClick={() => go(l.id)}
                className="mono-tag text-fog transition-colors duration-300 hover:text-electric-soft"
              >
                {l.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-3"
            aria-label="Open menu"
          >
            <span className={`mono-tag hidden transition-colors md:inline ${scrolled ? '' : 'text-fog'}`}>
              MENU
            </span>
            <Menu size={20} className="text-snow" />
          </button>
        </nav>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            exit={{ clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 z-[90] flex flex-col bg-abyss/[0.985] backdrop-blur-2xl"
          >
            <div className="flex items-center justify-between px-5 pt-5 md:px-10 md:pt-7">
              <span className="mono-tag">NAVIGATION</span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex h-10 w-10 items-center justify-center border border-white/10 transition-colors hover:border-electric"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-1 flex-col justify-center px-5 md:px-10">
              <ul className="mx-auto w-full max-w-[1400px]">
                {MENU_LINKS.map((l, i) => (
                  <motion.li
                    key={l.label}
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.25 + i * 0.06, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="border-b border-white/5"
                  >
                    <button
                      onClick={() => go(l.id)}
                      className="group flex w-full items-baseline justify-between py-4 text-left md:py-5"
                    >
                      <span className="font-display text-4xl font-semibold tracking-tight text-snow transition-colors duration-300 group-hover:text-electric-soft md:text-6xl">
                        {l.label}
                      </span>
                      <span className="mono-sm flex items-center gap-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        {String(i + 1).padStart(2, '0')} <ArrowUpRight size={14} />
                      </span>
                    </button>
                  </motion.li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-4 px-5 pb-8 md:flex-row md:items-center md:justify-between md:px-10">
              <div className="flex items-center gap-4">
                <a href={SITE.github} target="_blank" rel="noreferrer" aria-label="GitHub" className="text-fog transition-colors hover:text-electric-soft">
                  <GithubIcon size={18} />
                </a>
                {SITE.linkedin ? (
                  <a href={SITE.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn" className="text-fog transition-colors hover:text-electric-soft">
                    <LinkedinIcon size={18} />
                  </a>
                ) : null}
                {SITE.email ? (
                  <a href={`mailto:${SITE.email}`} aria-label="Email" className="text-fog transition-colors hover:text-electric-soft">
                    <Mail size={18} />
                  </a>
                ) : null}
              </div>
              <div className="mono-tag flex items-center gap-3">
                <span className="pulse-dot" /> AVAILABLE FOR NEW IDEAS
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ============================ CHAPTER =============================== */

export function Chapter({ n, title, sub }: { n: string; title: string; sub?: string }) {
  return (
    <section
      data-chapter={n}
      className="relative flex min-h-[64vh] flex-col justify-center overflow-hidden py-[14vh]"
    >
      <div className="mx-auto w-full max-w-[1400px] px-5 md:px-10">
        <div className="mono-tag mb-7 flex items-center gap-4" data-reveal>
          <span className="text-electric-soft">CHAPTER {n}</span>
          <span className="h-px w-14 bg-electric/50" />
          <span>{CHAPTERS.find((c) => c.n === n)?.title}</span>
        </div>
        <h2
          className="font-display text-[clamp(3rem,10.5vw,9rem)] font-bold leading-[0.95] tracking-tight text-snow"
          data-reveal="words"
        >
          {title}
        </h2>
        {sub ? (
          <p className="mt-6 max-w-md text-fog" data-reveal>
            {sub}
          </p>
        ) : null}
      </div>
    </section>
  );
}

/* ======================= CHAPTER INDICATOR ========================= */

export function ChapterIndicator() {
  const txtRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const txt = txtRef.current!;
    const bar = barRef.current!;
    txt.textContent = 'CH 00 · IDENTITY';

    const sts = [...document.querySelectorAll<HTMLElement>('[data-chapter]')].map((sec) => {
        const n = sec.dataset.chapter!;
        const title = CHAPTERS.find((c) => c.n === n)?.title ?? '';
        return ScrollTrigger.create({
          trigger: sec,
          start: 'top 55%',
          end: 'bottom 45%',
          onToggle: (self) => {
            if (self.isActive) {
              txt.textContent = `CH ${n} · ${title}`;
              if (!reducedMotion) {
                gsap.fromTo(
                  txt,
                  { y: 10, opacity: 0 },
                  { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }
                );
              }
            }
          },
        });
    });

    const progress = ScrollTrigger.create({
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        bar.style.transform = `scaleY(${self.progress})`;
      },
    });

    return () => {
      sts.forEach((s) => s.kill());
      progress.kill();
    };
  }, []);

  return (
    <>
      <div className="pointer-events-none fixed bottom-5 left-5 z-[60] hidden items-center gap-3 md:flex">
        <span ref={txtRef} className="mono-sm" />
      </div>
      <div className="pointer-events-none fixed bottom-5 right-5 z-[60] hidden h-24 w-px bg-white/10 md:block">
        <div
          ref={barRef}
          className="h-full w-full origin-top bg-electric"
          style={{ transform: 'scaleY(0)' }}
        />
      </div>
    </>
  );
}

/* ============================ FOOTER ================================ */

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/5 pb-10 pt-16">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-10 px-5 md:flex-row md:items-end md:justify-between md:px-10">
        <div>
          <div className="font-display text-2xl font-semibold tracking-[0.2em] text-snow">
            ANUGRAH A
          </div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-fog">
            Computer Science &amp; Engineering
            <br />
            {SITE.school}
          </p>
        </div>

        <div className="text-sm leading-relaxed text-faint">
          Built with curiosity.
          <br />
          Designed with intention.
        </div>

        <div className="flex flex-col items-start gap-4 md:items-end">
          <div className="mono-tag flex items-center gap-3">
            <span className="pulse-dot" /> AVAILABLE FOR NEW IDEAS
          </div>
          <button onClick={() => scrollToId('top')} className="group flex items-center gap-2" aria-label="Back to top">
            <span className="mono-sm transition-colors group-hover:text-electric-soft">BACK TO TOP</span>
            <ArrowUp size={14} className="transition-transform duration-300 group-hover:-translate-y-1" />
          </button>
        </div>
      </div>

      <div className="mx-auto mt-12 flex w-full max-w-[1400px] items-center justify-between border-t border-white/5 px-5 pt-6 md:px-10">
        <span className="mono-sm">© {SITE.year} Anugrah A</span>
        <span className="mono-sm hidden sm:inline">PORTFOLIO v2.0 — DESIGNED &amp; BUILT BY ANUGRAH A</span>
      </div>
    </footer>
  );
}

/* =========================== EASTER EGG ============================= */

export function EasterEgg() {
  const [show, setShow] = useState(false);
  const buf = useRef('');
  const busy = useRef(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.key.length !== 1) return;
      buf.current = (buf.current + e.key.toUpperCase()).slice(-8);
      if (buf.current.endsWith('ANUGRAH') && !busy.current) {
        buf.current = '';
        busy.current = true;
        setShow(true);
        window.setTimeout(() => {
          setShow(false);
          busy.current = false;
        }, 3200);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.6 } }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[150] flex flex-col items-center justify-center bg-ink/[0.96]"
        >
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.2, duration: 0.5 } }}
            className="mono-tag text-electric-soft"
          >
            SYSTEM UNLOCKED
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1, transition: { delay: 0.8, duration: 0.7, ease: [0.22, 1, 0.36, 1] } }}
            className="mt-6 font-display text-5xl font-bold tracking-tight text-snow md:text-7xl"
          >
            Keep building.
          </motion.h2>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
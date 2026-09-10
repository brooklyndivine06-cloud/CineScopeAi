'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowUpRight } from 'lucide-react';
import { SITE } from '@/lib/site';
import { reducedMotion, scrollToId } from '@/lib/anim';

gsap.registerPlugin(ScrollTrigger);

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const imgWrapRef = useRef<HTMLDivElement>(null);
  const lightRef = useRef<HTMLDivElement>(null);
  const ready = useRef(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const entrance = () => {
      if (ready.current || reducedMotion) {
        section.classList.remove('hero-locked');
        return;
      }
      ready.current = true;
      section.classList.remove('hero-locked');
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.fromTo(
        section.querySelectorAll<HTMLElement>('.h-line'),
        { yPercent: 115 },
        { yPercent: 0, duration: 1.1, stagger: 0.12, ease: 'power4.out' },
        0.1
      );
      tl.fromTo(
        section.querySelectorAll<HTMLElement>('.h-fade'),
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, stagger: 0.08 },
        0.55
      );
      tl.fromTo(
        section.querySelector('.portrait-panel'),
        { clipPath: 'inset(100% 0 0 0)', opacity: 0.4 },
        { clipPath: 'inset(0% 0 0 0)', opacity: 1, duration: 1.2, ease: 'power4.inOut' },
        0.35
      );
      tl.fromTo(
        section.querySelectorAll<HTMLElement>('.h-meta'),
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.07 },
        1.0
      );
    };

    const onReady = () => entrance();
    window.addEventListener('portfolio:ready', onReady);

    // mouse-follow lighting + portrait parallax
    let mx = 0.5;
    let my = 0.5;
    let tx = 0;
    let ty = 0;
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      const r = section.getBoundingClientRect();
      mx = Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1);
      my = Math.min(Math.max((e.clientY - r.top) / r.height, 0), 1);
      if (lightRef.current) {
        lightRef.current.style.setProperty('--mx', `${mx * 100}%`);
        lightRef.current.style.setProperty('--my', `${my * 100}%`);
      }
    };
    const loop = () => {
      tx += (mx - tx) * 0.06;
      ty += (my - ty) * 0.06;
      if (imgWrapRef.current) {
        imgWrapRef.current.style.transform = `translate3d(${(tx - 0.5) * -22}px, ${(ty - 0.5) * -16}px, 0) scale(1.12)`;
      }
      raf = requestAnimationFrame(loop);
    };
    if (window.matchMedia('(pointer: fine)').matches && !reducedMotion) {
      window.addEventListener('mousemove', onMove);
      raf = requestAnimationFrame(loop);
    }

    // exit parallax
    const exit = gsap.to(section.querySelector('.hero-copy'), {
      yPercent: -14,
      opacity: 0.15,
      ease: 'none',
      scrollTrigger: { trigger: section, start: 'top top', end: 'bottom top', scrub: true },
    });
    const panel = gsap.to(section.querySelector('.portrait-panel'), {
      yPercent: 8,
      ease: 'none',
      scrollTrigger: { trigger: section, start: 'top top', end: 'bottom top', scrub: true },
    });

    return () => {
      window.removeEventListener('portfolio:ready', onReady);
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
      exit.scrollTrigger?.kill();
      exit.kill();
      panel.scrollTrigger?.kill();
      panel.kill();
    };
  }, []);

  return (
    <section
      id="top"
      ref={sectionRef}
      className="hero-locked relative flex min-h-[100svh] items-center overflow-hidden pb-10 pt-28"
    >
      <div className="relative z-10 mx-auto w-full max-w-[1400px] px-5 md:px-10">
        <div className="grid items-center gap-12 lg:grid-cols-[1.12fr_0.88fr] lg:gap-10">
          {/* copy */}
          <div className="hero-copy">
            <div className="h-fade mono-tag mb-8 flex items-center gap-3">
              <span className="pulse-dot" />
              PORTFOLIO // 2026 — SYSTEM ONLINE
            </div>

            <h1 className="font-display text-[clamp(4rem,12.5vw,10.5rem)] font-bold leading-[0.92] tracking-tight text-snow">
              <span className="block overflow-hidden pb-1">
                <span className="h-line block">ANUGRAH</span>
              </span>
              <span className="block overflow-hidden pb-2">
                <span className="h-line block">
                  A<span className="text-electric text-glow">.</span>
                </span>
              </span>
            </h1>

            <div className="h-fade mt-8 flex flex-col gap-1">
              <span className="font-display text-xl font-medium text-electric-soft md:text-2xl">
                Computer Science Engineering Student
              </span>
              <span className="font-display text-lg text-snow/90 md:text-xl">
                Building modern web experiences and intelligent digital products.
              </span>
            </div>

            <p className="h-fade mt-6 max-w-md leading-relaxed text-fog">
              I’m a B.Tech Computer Science and Engineering student at Adi Shankara
              Institute of Engineering and Technology, interested in web development,
              artificial intelligence, problem solving, and building technology that
              people can actually use.
            </p>

            <div className="h-fade mt-10 flex flex-wrap items-center gap-4">
              <button onClick={() => scrollToId('work')} className="btn btn-primary" data-cursor="view">
                EXPLORE MY WORK <ArrowUpRight size={14} className="btn-arrow" />
              </button>
              <button onClick={() => scrollToId('resume')} className="btn btn-ghost">
                VIEW RESUME
              </button>
              {SITE.linkedin ? (
                <a
                  href={SITE.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="mono-tag flex items-center gap-1 text-fog transition-colors hover:text-electric-soft"
                >
                  LINKEDIN <ArrowUpRight size={12} />
                </a>
              ) : null}
            </div>
          </div>

          {/* portrait panel */}
          <div className="portrait-panel relative mx-auto w-full max-w-[520px]">
            <div className="relative aspect-[4/5] overflow-hidden rounded-md border border-white/10 bg-navy">
              <div ref={imgWrapRef} className="absolute inset-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/hero-panel.jpg"
                  alt="Abstract digital panel — Anugrah A"
                  className="h-full w-full object-cover"
                  style={{ transform: 'scale(1.12)' }}
                />
                {/* real portrait: drop a photo at public/images/portrait.jpg and it
                    appears automatically (until then the abstract panel shows) */}
                <img
                  src="/images/portrait.jpg"
                  alt="Anugrah A"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                  className="absolute inset-0 h-full w-full object-cover object-top"
                  style={{ transform: 'scale(1.12)' }}
                />
              </div>

              {/* mouse-follow light */}
              <div
                ref={lightRef}
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'radial-gradient(420px circle at var(--mx, 50%) var(--my, 40%), rgba(63,140,255,0.22), transparent 60%)',
                }}
              />

              <div className="scanline" />

              {/* metadata labels */}
              <div className="h-meta mono-sm absolute left-4 top-4 text-snow/90">ANUGRAH A</div>
              <div className="h-meta mono-sm absolute right-4 top-4 text-right">CSE / 2024—PRESENT</div>
              <div className="h-meta mono-sm absolute bottom-4 left-4">{SITE.location.toUpperCase()}</div>
              <button
                onClick={() => scrollToId('work')}
                className="h-meta mono-sm absolute bottom-4 right-4 text-right text-electric-soft transition-opacity hover:opacity-70"
              >
                CURRENTLY BUILDING
                <br />→ IDAM
              </button>

              {/* corner brackets */}
              <span className="pointer-events-none absolute left-2 top-2 h-5 w-5 border-l border-t border-electric/70" />
              <span className="pointer-events-none absolute right-2 top-2 h-5 w-5 border-r border-t border-electric/70" />
              <span className="pointer-events-none absolute bottom-2 left-2 h-5 w-5 border-b border-l border-electric/70" />
              <span className="pointer-events-none absolute bottom-2 right-2 h-5 w-5 border-b border-r border-electric/70" />
            </div>

            {/* panel footnote */}
            <div className="h-meta mono-sm mt-3 flex items-center justify-between">
              <span>FIG. 01 — IDENTITY SPECIMEN</span>
              <span>SCROLL ↓</span>
            </div>
          </div>
        </div>

        {/* scroll cue */}
        <div className="h-fade mt-14 flex items-center gap-5">
          <span className="mono-sm">SCROLL</span>
          <span className="relative h-px flex-1 overflow-hidden bg-white/10">
            <span className="absolute inset-y-0 left-0 w-1/3 animate-[scroll-cue_2.8s_cubic-bezier(0.45,0,0.55,1)_infinite] bg-electric/80" />
          </span>
          <span className="mono-sm">001 / 006</span>
        </div>
      </div>
    </section>
  );
}

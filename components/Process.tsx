'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { PROCESS_STEPS } from '@/lib/site';
import { reducedMotion } from '@/lib/anim';

gsap.registerPlugin(ScrollTrigger);

/* ---------- micro-animations per step ---------- */

function IdeaViz() {
  return (
    <div className="space-y-2 font-mono text-xs">
      <div className="flex items-center gap-2 text-fog">
        <span className="text-electric">&gt;</span> what problem are we solving
        <span className="caret-blink text-electric">▊</span>
      </div>
      <div className="pl-5 text-faint">users drown in listings…</div>
      <div className="pl-5 text-faint">noise out, intent in.</div>
    </div>
  );
}

function StructureViz() {
  return (
    <svg viewBox="0 0 220 120" className="w-full max-w-[280px]">
      <g className="wire-draw" fill="none" stroke="rgba(138,182,255,0.55)" strokeWidth="1.5">
        <rect x="6" y="6" width="208" height="34" rx="3" />
        <rect x="6" y="48" width="120" height="66" rx="3" />
        <rect x="134" y="48" width="80" height="30" rx="3" />
        <rect x="134" y="84" width="80" height="30" rx="3" />
      </g>
      <line x1="16" y1="23" x2="120" y2="23" stroke="rgba(238,242,248,0.3)" strokeWidth="2" />
    </svg>
  );
}

function DesignViz() {
  return (
    <div className="space-y-3">
      {[
        { w: '82%', c: 'bg-electric', d: '0s' },
        { w: '58%', c: 'bg-electric-soft', d: '0.5s' },
        { w: '36%', c: 'bg-fog', d: '1s' },
      ].map((b, i) => (
        <div key={i} className="h-2 w-full overflow-hidden rounded-full bg-white/6">
          <div className={`h-full ${b.c} bar-pulse`} style={{ width: b.w, animationDelay: b.d }} />
        </div>
      ))}
      <div className="mono-sm pt-1">contrast · rhythm · focus</div>
    </div>
  );
}

function BuildViz() {
  const lines = ['const flow = useDiscovery();', 'await flow.filter(budget, bhk);', 'render(results, { stagger: 90 });', 'ship(); // iterate tomorrow'];
  return (
    <div className="space-y-2 overflow-hidden font-mono text-xs">
      {lines.map((l, i) => (
        <div key={i} className="code-line whitespace-nowrap" style={{ animationDelay: `${i * 1.4}s` }}>
          <span className="mr-2 text-faint">{i + 1}</span>
          <span className="text-fog">{l}</span>
        </div>
      ))}
    </div>
  );
}

function TestViz() {
  return (
    <div className="space-y-2.5 font-mono text-xs">
      {['filters compose ✓', 'empty states handled ✓', 'mobile: 375px ✓'].map((t, i) => (
        <div key={t} className="flex items-center gap-2 check-cycle" style={{ animationDelay: `${i * 1.1}s` }}>
          <span className="flex h-4 w-4 items-center justify-center rounded-sm border border-electric/60 bg-electric/15 text-[9px] text-electric-soft">✓</span>
          <span className="text-fog">{t}</span>
        </div>
      ))}
      <div className="check-cycle mt-1 flex items-center gap-2" style={{ animationDelay: '3.3s' }}>
        <span className="flex h-4 w-4 items-center justify-center rounded-sm border border-[#febc2e]/60 bg-[#febc2e]/15 text-[9px] text-[#febc2e]">!</span>
        <span className="text-fog">OTP boxes jitter on iOS → fixed</span>
      </div>
    </div>
  );
}

function IterateViz() {
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 48 48" className="spin-slow h-12 w-12">
        <path
          d="M24 6 a18 18 0 1 1 -12.7 5.3"
          fill="none"
          stroke="rgba(138,182,255,0.6)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path d="M11 4 L8 14 L18 12 Z" fill="rgba(138,182,255,0.6)" />
      </svg>
      <div>
        <div className="mono-sm">v1.0 → v1.1 → v1.2</div>
        <div className="mono-sm mt-1 text-electric-soft">each loop: smaller frictions</div>
      </div>
    </div>
  );
}

const VIZ = [IdeaViz, StructureViz, DesignViz, BuildViz, TestViz, IterateViz];

/* ---------- section ---------- */

export function Process() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reducedMotion) return;
    if (!window.matchMedia('(min-width: 768px)').matches) return;

    const track = trackRef.current!;
    const section = sectionRef.current!;
    let st: gsap.core.Tween | null = null;

    const setup = () => {
      st?.scrollTrigger?.kill();
      st?.kill();
      const dist = track.scrollWidth - window.innerWidth;
      if (dist <= 0) return;
      st = gsap.to(track, {
        x: -dist,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: `+=${dist}`,
          scrub: 0.6,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });
    };
    setup();
    window.addEventListener('resize', setup);
    return () => {
      window.removeEventListener('resize', setup);
      st?.scrollTrigger?.kill();
      st?.kill();
    };
  }, []);

  return (
    <section id="process" ref={sectionRef} className="relative overflow-hidden py-20 md:py-0">
      <div
        ref={trackRef}
        className="mx-auto flex w-full max-w-[1400px] items-stretch gap-6 px-5 py-4 md:w-max md:max-w-none md:items-center md:gap-8 md:overflow-hidden md:px-10 md:py-0"
      >
        {/* intro panel */}
        <div className="flex w-[85vw] flex-none flex-col justify-center md:h-[70vh] md:w-[52vw]">
          <div className="mono-tag mb-6" data-reveal>
            HOW I BUILD / 04
          </div>
          <h2
            className="font-display text-[clamp(2.6rem,6vw,5rem)] font-bold leading-[0.98] tracking-tight text-snow"
            data-reveal="words"
          >
            From idea
            <br />
            to interface<span className="text-electric">.</span>
          </h2>
          <p className="mt-6 max-w-sm leading-relaxed text-fog" data-reveal>
            Six stages, repeated until the experience makes sense. Scroll to move through
            the process — each stage keeps its own small animation.
          </p>
          <div className="mono-sm mt-10 hidden md:block">SCROLL →</div>
        </div>

        {PROCESS_STEPS.map((s, i) => {
          const Viz = VIZ[i];
          return (
            <div
              key={s.n}
              className="group relative flex w-[85vw] flex-none flex-col justify-between overflow-hidden rounded-md border border-white/8 bg-navy/50 p-8 md:h-[70vh] md:w-[40vw] md:p-10"
              data-reveal="scale"
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
                style={{ background: 'radial-gradient(500px circle at 100% 0%, rgba(63,140,255,0.07), transparent 60%)' }}
              />
              <div className="flex items-start justify-between">
                <span className="font-display text-5xl font-bold text-white/12 md:text-6xl">
                  {s.n}
                </span>
                <span className="mono-sm text-electric-soft">STAGE {s.n} / 06</span>
              </div>
              <div>
                <h3 className="font-display text-3xl font-semibold tracking-tight text-snow md:text-4xl">
                  {s.title}
                </h3>
                <p className="mt-3 text-fog">{s.q}</p>
              </div>
              <div className="border-t border-white/8 pt-6">
                <Viz />
              </div>
              <span className="absolute bottom-0 left-0 h-px w-full origin-left scale-x-0 bg-electric/60 transition-transform duration-700 group-hover:scale-x-100" />
            </div>
          );
        })}
      </div>
    </section>
  );
}

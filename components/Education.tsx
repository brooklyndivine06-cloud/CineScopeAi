'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CURRENTLY_LEARNING } from '@/lib/site';
import { reducedMotion } from '@/lib/anim';

gsap.registerPlugin(ScrollTrigger);

const MARKS = [
  { year: '2024', label: 'B.Tech CSE — started', active: true },
  { year: '2025', label: '', active: false },
  { year: '2026', label: '', active: false },
  { year: '2027', label: '', active: false },
];

export function Education() {
  const lineRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (reducedMotion || !lineRef.current) return;
    const st = gsap.fromTo(
      lineRef.current,
      { scaleX: 0 },
      {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 70%',
          end: 'center 30%',
          scrub: 0.8,
        },
      }
    );
    return () => {
      st.scrollTrigger?.kill();
      st.kill();
    };
  }, []);

  return (
    <section id="education" ref={sectionRef} className="relative py-24 md:py-32">
      <div className="mx-auto w-full max-w-[1400px] px-5 md:px-10">
        <div className="mono-tag mb-10" data-reveal>
          EDUCATION
        </div>
        <h2
          className="mb-16 font-display text-[clamp(2.2rem,5vw,4rem)] font-bold leading-[1.02] tracking-tight text-snow"
          data-reveal="words"
        >
          Grounds and progress.
        </h2>

        {/* ---------- desktop timeline ---------- */}
        <div className="relative hidden h-72 md:block" data-reveal>
          {/* base line */}
          <div className="absolute left-0 right-0 top-[38%] h-px bg-white/10" />
          {/* glowing progress line */}
          <div
            ref={lineRef}
            className="absolute left-0 right-0 top-[38%] h-px origin-left bg-gradient-to-r from-electric via-electric to-electric/20"
            style={{ transform: 'scaleX(0)', boxShadow: '0 0 18px rgba(63,140,255,0.65)' }}
          />

          {MARKS.map((m, i) => (
            <div
              key={m.year}
              className="absolute top-0 h-full"
              style={{ left: `${6 + i * 30}%` }}
            >
              <div className="relative mt-[calc(38%-11px)] flex h-[22px] w-[22px] items-center justify-center">
                <span
                  className={`block h-3 w-3 rotate-45 border ${
                    m.active
                      ? 'border-electric bg-electric shadow-[0_0_16px_rgba(63,140,255,0.8)]'
                      : 'border-white/25 bg-ink'
                  }`}
                />
                {m.active && (
                  <span className="absolute inset-0 animate-ping border border-electric/50" />
                )}
              </div>
              <div className={`mt-3 font-mono text-sm ${m.active ? 'text-electric-soft' : 'text-faint'}`}>
                {m.year}
              </div>
              {m.active && (
                <div className="glass mt-4 w-72 rounded-sm p-5">
                  <div className="mono-sm mb-2 text-electric-soft">2024 → PRESENT</div>
                  <div className="font-display text-lg font-semibold leading-snug text-snow">
                    B.Tech Computer Science &amp; Engineering
                  </div>
                  <div className="mt-2 text-sm leading-relaxed text-fog">
                    Adi Shankara Institute of Engineering and Technology
                    <br />
                    Kalady, Kerala
                  </div>
                </div>
              )}
              {!m.active && (
                <div className="mt-4 hidden w-40 text-[11px] leading-relaxed text-faint/60 lg:block">
                  {i === 1 ? 'In progress…' : 'Ahead.'}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ---------- mobile timeline ---------- */}
        <div className="relative border-l border-white/10 pl-8 md:hidden" data-reveal>
          {MARKS.map((m) => (
            <div key={m.year} className="relative pb-10 last:pb-0">
              <span
                className={`absolute -left-[37px] top-1 block h-3 w-3 rotate-45 border ${
                  m.active ? 'border-electric bg-electric' : 'border-white/25 bg-ink'
                }`}
              />
              <div className={`font-mono text-sm ${m.active ? 'text-electric-soft' : 'text-faint'}`}>
                {m.year}
                {m.active ? ' → PRESENT' : ''}
              </div>
              {m.active && (
                <>
                  <div className="mt-2 font-display text-lg font-semibold text-snow">
                    B.Tech Computer Science &amp; Engineering
                  </div>
                  <div className="mt-1 text-sm text-fog">
                    Adi Shankara Institute of Engineering and Technology — Kalady, Kerala
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* currently learning */}
        <div className="mt-16 md:mt-20" data-reveal>
          <div className="mono-sm mb-5">CURRENTLY LEARNING</div>
          <div className="flex flex-wrap gap-2">
            {CURRENTLY_LEARNING.map((c) => (
              <span key={c} className="chip cursor-default">
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

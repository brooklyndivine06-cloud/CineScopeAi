'use client';

import { useEffect, useRef } from 'react';
import { ABOUT_COPY, PHILOSOPHY } from '@/lib/site';
import { attachTilt } from '@/lib/anim';

/* ============================ INTRO ================================= */

export function Intro() {
  return (
    <section className="relative py-[18vh] md:py-[24vh]">
      <div className="mx-auto w-full max-w-[1400px] px-5 md:px-10">
        <div className="mono-tag mb-8" data-reveal>
          STATEMENT
        </div>
        <h2
          className="font-display text-[clamp(2.7rem,8.2vw,7.2rem)] font-bold leading-[1.02] tracking-tight text-snow"
          data-reveal="scrub-words"
        >
          I LIKE TURNING{' '}
          <span className="text-electric text-glow">IDEAS INTO INTERFACES.</span>
        </h2>
        <div className="relative mt-10 h-px w-full bg-white/10" data-reveal="line-scrub">
          <div
            data-line-bar
            className="absolute inset-y-0 left-0 w-full origin-left bg-gradient-to-r from-electric via-electric-soft to-transparent"
            style={{ transform: 'scaleX(0)' }}
          />
        </div>
        <p className="mt-8 max-w-xl font-display text-xl leading-relaxed text-fog md:text-2xl" data-reveal>
          And interfaces into experiences.
        </p>
      </div>
    </section>
  );
}

/* ============================ ABOUT ================================= */

export function About() {
  return (
    <section id="about" className="relative py-24 md:py-32">
      <div className="mx-auto w-full max-w-[1400px] px-5 md:px-10">
        <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <div className="mono-tag mb-7" data-reveal>
              ABOUT / 01
            </div>
            <h2
              className="font-display text-[clamp(2.4rem,5vw,4.2rem)] font-bold leading-[1.02] tracking-tight text-snow"
              data-reveal="words"
            >
              I build to understand.
            </h2>
            <div className="mono-sm mt-8 flex items-center gap-3" data-reveal>
              <span className="h-px w-10 bg-electric/60" />
              B.TECH CSE — {`'`}24 · KERALA, IN
            </div>
          </div>
          <div className="flex flex-col justify-center gap-6">
            {ABOUT_COPY.map((p, i) => (
              <p
                key={i}
                className={`leading-relaxed ${i === 0 ? 'text-lg text-snow/90' : 'text-fog'}`}
                data-reveal
              >
                {p}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ========================== PHILOSOPHY ============================== */

export function Philosophy() {
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const els = cardsRef.current?.querySelectorAll<HTMLElement>('[data-tilt]');
    if (!els) return;
    const cleanups = [...els].map((el) => attachTilt(el, 6));
    return () => cleanups.forEach((fn) => fn());
  }, []);

  return (
    <section className="relative py-24 md:py-32">
      <div className="mx-auto w-full max-w-[1400px] px-5 md:px-10">
        <div className="mb-14 grid items-end gap-8 md:grid-cols-2">
          <h2 className="font-display text-[clamp(3rem,7vw,5.6rem)] font-bold leading-[0.98] tracking-tight" data-reveal="words">
            <span className="block text-snow">Think.</span>
            <span className="block text-fog">Build.</span>
            <span className="block text-electric text-glow">Iterate.</span>
          </h2>
          <p className="max-w-sm text-fog md:justify-self-end" data-reveal>
            Good software isn’t only about making something work. It’s about making the
            experience make sense.
          </p>
        </div>

        <div ref={cardsRef} className="grid gap-5 md:grid-cols-3">
          {PHILOSOPHY.map((c) => (
            <div
              key={c.n}
              data-tilt
              className="tilt-card group relative overflow-hidden rounded-sm border border-white/8 bg-navy/60 p-8"
              data-reveal="scale"
            >
              <div className="tilt-spotlight" />
              <div className="mono-sm mb-10 text-electric-soft">{c.n}</div>
              <div className="font-display text-3xl font-semibold tracking-tight text-snow transition-colors duration-300 group-hover:text-electric-soft">
                {c.title}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-fog">{c.copy}</p>
              <div className="absolute bottom-0 left-0 h-px w-full origin-left scale-x-0 bg-electric/60 transition-transform duration-700 group-hover:scale-x-100" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

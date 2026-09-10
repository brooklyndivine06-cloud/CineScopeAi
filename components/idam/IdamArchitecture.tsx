'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronDown } from 'lucide-react';
import { ARCH_NODES } from '@/lib/site';
import { reducedMotion } from '@/lib/anim';

gsap.registerPlugin(ScrollTrigger);

export function IdamArchitecture() {
  const [active, setActive] = useState(0);
  const spineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reducedMotion || !spineRef.current) return;
    const st = gsap.fromTo(
      spineRef.current,
      { scaleY: 0 },
      {
        scaleY: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: spineRef.current.parentElement,
          start: 'top 75%',
          end: 'bottom 45%',
          scrub: 0.8,
        },
      }
    );
    return () => {
      st.scrollTrigger?.kill();
      st.kill();
    };
  }, []);

  const node = ARCH_NODES[active];

  return (
    <section className="relative bg-abyss/60 py-24 md:py-32">
      <div className="mx-auto w-full max-w-[1400px] px-5 md:px-10">
        <div className="mb-14">
          <div className="mono-tag mb-6" data-reveal>
            FEATURE ARCHITECTURE / 05
          </div>
          <h2
            className="font-display text-[clamp(2.2rem,5vw,4rem)] font-bold leading-[1.02] tracking-tight text-snow"
            data-reveal="words"
          >
            One flow, six stages.
          </h2>
          <p className="mt-4 max-w-md text-fog" data-reveal>
            The IDAM experience as a system. Select a stage to inspect it.
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-[1fr_0.9fr]">
          {/* node chain */}
          <div className="relative" data-reveal>
            <div
              ref={spineRef}
              className="absolute bottom-8 left-[27px] top-8 w-px origin-top bg-gradient-to-b from-electric via-electric/70 to-electric/20"
              style={{ transform: 'scaleY(0)', boxShadow: '0 0 12px rgba(63,140,255,0.5)' }}
            />
            <ul className="space-y-3">
              {ARCH_NODES.map((n, i) => (
                <li key={n.id}>
                  <button
                    onClick={() => setActive(i)}
                    className={`group flex w-full items-center gap-5 rounded-sm border px-4 py-4 text-left transition-all duration-500 ${
                      active === i
                        ? 'border-electric/60 bg-electric/[0.07] shadow-[0_0_30px_rgba(63,140,255,0.12)]'
                        : 'border-white/8 bg-navy/40 hover:border-electric/30'
                    }`}
                  >
                    <span
                      className={`relative z-10 flex h-[22px] w-[22px] flex-none rotate-45 items-center justify-center border transition-all duration-500 ${
                        active === i
                          ? 'border-electric bg-electric shadow-[0_0_18px_rgba(63,140,255,0.8)]'
                          : i < active
                            ? 'border-electric/50 bg-electric/20'
                            : 'border-white/25 bg-ink'
                      }`}
                    />
                    <span
                      className={`font-display text-sm font-semibold tracking-[0.16em] transition-colors duration-300 md:text-base ${
                        active === i ? 'text-white' : 'text-fog group-hover:text-snow'
                      }`}
                    >
                      {n.title}
                    </span>
                    <span className="ml-auto hidden text-faint transition-colors group-hover:text-electric-soft sm:block">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </button>
                  {i < ARCH_NODES.length - 1 && (
                    <div className="flex justify-center py-1.5">
                      <ChevronDown size={13} className="text-electric/50" />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* detail panel */}
          <div className="lg:sticky lg:top-28 lg:self-start" data-reveal="right">
            <div className="glass relative overflow-hidden rounded-md p-8">
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'radial-gradient(400px circle at 80% 0%, rgba(63,140,255,0.08), transparent 60%)',
                }}
              />
              <div className="mono-sm text-electric-soft">
                STAGE {String(active + 1).padStart(2, '2')} / 06
              </div>
              <h3
                key={node.id}
                className="mt-4 font-display text-3xl font-semibold tracking-tight text-snow md:text-4xl"
              >
                {node.title}
              </h3>
              <p key={node.id + 'd'} className="mt-5 leading-relaxed text-fog">
                {node.desc}
              </p>
              <div className="mt-7 flex flex-wrap gap-2">
                {node.tags.map((t) => (
                  <span key={t} className="chip cursor-default">
                    {t}
                  </span>
                ))}
              </div>
              <div className="mt-8 flex items-center gap-2 border-t border-white/10 pt-5">
                <span className="pulse-dot" />
                <span className="mono-sm">LIVE IN IDAM TODAY</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

'use client';

import { useMemo, useState } from 'react';
import { TECH, TECH_CATS, type Tech, type TechCat } from '@/lib/site';

type Filter = 'All' | TechCat;

/* deterministic pseudo-jitter so layout is stable */
const jitter = (i: number) => ((i * 137.508) % 36) * (Math.PI / 180);

export function Skills() {
  const [filter, setFilter] = useState<Filter>('All');
  const [active, setActive] = useState<Tech | null>(null);

  const nodes = useMemo(
    () =>
      TECH.map((t, i) => {
        const angle = (i / TECH.length) * Math.PI * 2 - Math.PI / 2 + jitter(i);
        const ring = i % 2 === 0 ? 0.315 : 0.455;
        const isDim = filter !== 'All' && !t.cats.includes(filter);
        const isActive = active?.name === t.name;
        const hasActive = active !== null;
        const radius = ring * (isActive ? 0.76 : hasActive ? 1.05 : 1);
        const x = 50 + Math.cos(angle) * radius * 100;
        const y = 50 + Math.sin(angle) * radius * 100 * 0.9;
        return { tech: t, x, y, isDim, isActive, size: isActive ? 1.12 : 1 };
      }),
    [filter, active]
  );

  return (
    <section id="lab" className="relative py-24 md:py-28">
      <div className="mx-auto w-full max-w-[1400px] px-5 md:px-10">
        <div className="mb-10 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mono-tag mb-6" data-reveal>
              CAPABILITIES / 02
            </div>
            <h2
              className="font-display text-[clamp(2.4rem,5.5vw,4.4rem)] font-bold leading-[1.02] tracking-tight text-snow"
              data-reveal="words"
            >
              The technology universe.
            </h2>
            <p className="mt-4 max-w-md text-fog" data-reveal>
              The tools I actually use. Hover a node to inspect it — filter to see how the
              stack organizes itself.
            </p>
          </div>

          <div className="flex flex-wrap gap-2" data-reveal>
            {(['All', ...TECH_CATS] as Filter[]).map((c) => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={`chip ${filter === c ? 'active' : ''}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* ---------- desktop universe ---------- */}
        <div className="relative hidden aspect-square w-full select-none md:block" data-reveal="scale">
          {/* orbit rings */}
          <div className="orbit-ring orbit-spin-slow" style={{ width: '64%', height: '64%', transform: 'translate(-50%,-50%)' }} />
          <div className="orbit-ring orbit-spin-rev" style={{ width: '92%', height: '92%', transform: 'translate(-50%,-50%)' }} />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 50% 50%, rgba(63,140,255,0.07), transparent 55%)',
            }}
          />

          {/* center label */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
            <div className="mono-sm">ANUGRAH’S</div>
            <div className="font-display text-3xl font-semibold tracking-[0.14em] text-snow lg:text-4xl">
              TECH STACK
            </div>
          </div>

          {/* nodes */}
          {nodes.map(({ tech, x, y, isDim, isActive, size }) => (
            <button
              key={tech.name}
              onMouseEnter={() => setActive(tech)}
              onMouseLeave={() => setActive((a) => (a?.name === tech.name ? null : a))}
              onFocus={() => setActive(tech)}
              onClick={() => setActive(tech)}
              className="skill-node z-10"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                opacity: isDim ? 0.22 : 1,
                zIndex: isActive ? 20 : 10,
              }}
            >
              <span
                className={`block whitespace-nowrap border px-3 py-1.5 font-mono text-[11px] tracking-[0.14em] uppercase transition-all duration-500 ${
                  isActive
                    ? 'border-electric bg-electric/20 text-white shadow-[0_0_24px_rgba(63,140,255,0.45)]'
                    : 'border-white/15 bg-navy/70 text-fog hover:border-electric/60 hover:text-snow'
                }`}
                style={{ transform: `scale(${size})`, borderRadius: 999 }}
              >
                {tech.name}
              </span>
            </button>
          ))}

          {/* detail dock */}
          <div className="glass absolute bottom-0 right-0 w-72 rounded-sm p-5 transition-all duration-500">
            {active ? (
              <>
                <div className="mono-sm mb-2 text-electric-soft">NODE // {active.cats.join(' · ')}</div>
                <div className="font-display text-2xl font-semibold tracking-tight text-snow">
                  {active.name.toUpperCase()}
                </div>
                <ul className="mt-3 space-y-1.5">
                  {active.tags.map((t) => (
                    <li key={t} className="flex items-center gap-2 text-sm text-fog">
                      <span className="h-px w-3 bg-electric/60" />
                      {t}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 border-t border-white/10 pt-3">
                  <span className="mono-sm">USED FOR</span>
                  <div className="mt-1 font-mono text-xs text-electric-soft">
                    {active.usedFor.join(' / ')}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="mono-sm text-faint">NODE // —</div>
                <div className="mt-2 font-display text-lg font-medium text-fog">
                  Hover a node to inspect the stack.
                </div>
              </>
            )}
          </div>
        </div>

        {/* ---------- mobile list ---------- */}
        <div className="md:hidden">
          <div className="flex flex-wrap gap-2">
            {TECH.map((t) => (
              <button
                key={t.name}
                onClick={() => setActive((a) => (a?.name === t.name ? null : t))}
                className={`chip ${active?.name === t.name ? 'active' : ''} ${
                  filter !== 'All' && !t.cats.includes(filter) ? 'opacity-30' : ''
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
          <div className="glass mt-5 rounded-sm p-5">
            {active ? (
              <>
                <div className="mono-sm mb-2 text-electric-soft">{active.cats.join(' · ')}</div>
                <div className="font-display text-2xl font-semibold text-snow">{active.name}</div>
                <div className="mt-2 text-sm text-fog">{active.tags.join(' · ')}</div>
                <div className="mono-sm mt-4">
                  USED FOR — <span className="text-electric-soft">{active.usedFor.join(' / ')}</span>
                </div>
              </>
            ) : (
              <div className="text-sm text-fog">Tap a technology to inspect it.</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

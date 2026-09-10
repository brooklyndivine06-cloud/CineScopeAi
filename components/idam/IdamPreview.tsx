'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Heart, MapPin, Search, ShieldCheck, Building2 } from 'lucide-react';
import {
  BUDGETS,
  IDAM_CITIES,
  IDAM_TABS,
  LISTINGS,
  type BudgetId,
  type Listing,
} from '@/lib/site';
import { reducedMotion } from '@/lib/anim';

const BHK_OPTIONS = [1, 2, 3, 4];

function matches(
  l: Listing,
  city: string | null,
  bhk: number | null,
  budget: BudgetId | null
) {
  if (city && l.city !== city) return false;
  if (bhk !== null && l.bhk !== bhk && !(bhk === 4 && l.bhk > 4)) return false;
  if (budget) {
    const b = BUDGETS.find((x) => x.id === budget)!;
    if (l.price < b.min || l.price >= b.max) return false;
  }
  return true;
}

export function IdamPreview() {
  const [tab, setTab] = useState<string>('BUY');
  const [city, setCity] = useState<string | null>(null);
  const [bhk, setBhk] = useState<number | null>(null);
  const [budget, setBudget] = useState<BudgetId | null>(null);
  const [saved, setSaved] = useState<string[]>([]);
  const interacted = useRef(false);
  const resultsKey = useRef<string>('');

  const results = useMemo(
    () => LISTINGS.filter((l) => matches(l, city, bhk, budget)),
    [city, bhk, budget]
  );

  /* staged result reveal */
  useEffect(() => {
    const key = `${city}|${bhk}|${budget}`;
    if (key === resultsKey.current) return;
    resultsKey.current = key;
    const rows = document.querySelectorAll<HTMLElement>('[data-pv-card]');
    if (reducedMotion) {
      rows.forEach((r) => r.classList.add('shown'));
      return;
    }
    rows.forEach((r, i) => {
      r.classList.remove('shown');
      window.setTimeout(() => r.classList.add('shown'), 60 + i * 90);
    });
  }, [city, bhk, budget]);

  /* autoplay: 2 BHK → Kochi → ₹50L–₹80L */
  useEffect(() => {
    if (reducedMotion) {
      setBhk(2);
      setCity('Kochi');
      setBudget('b2');
      return;
    }
    const timers = [
      window.setTimeout(() => !interacted.current && setBhk(2), 1800),
      window.setTimeout(() => !interacted.current && setCity('Kochi'), 3600),
      window.setTimeout(() => !interacted.current && setBudget('b2'), 5400),
    ];
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, []);

  const stopAuto = () => {
    interacted.current = true;
  };

  const toggleSave = (id: string) => {
    stopAuto();
    setSaved((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  return (
    <section className="relative py-24 md:py-32">
      <div className="mx-auto w-full max-w-[1400px] px-5 md:px-10">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mono-tag mb-6" data-reveal>
              EXPERIENCE / 03
            </div>
            <h2
              className="font-display text-[clamp(2.2rem,5vw,4rem)] font-bold leading-[1.02] tracking-tight text-snow"
              data-reveal="words"
            >
              The product, in miniature.
            </h2>
          </div>
          <p className="mono-sm" data-reveal>
            INTERACTIVE PREVIEW — PICK YOUR OWN FILTERS
          </p>
        </div>

        {/* ---------- browser window ---------- */}
        <div className="glass overflow-hidden rounded-lg" data-reveal="scale">
          {/* chrome bar */}
          <div className="flex items-center gap-4 border-b border-white/8 bg-navy/80 px-4 py-3">
            <div className="flex gap-1.5">
              <span className="h-3 w-3 rounded-full bg-[#ff5f57]/80" />
              <span className="h-3 w-3 rounded-full bg-[#febc2e]/80" />
              <span className="h-3 w-3 rounded-full bg-[#28c840]/80" />
            </div>
            <div className="flex flex-1 items-center justify-center gap-2 rounded-sm bg-ink/70 px-4 py-1.5">
              <ShieldCheck size={12} className="text-electric-soft" />
              <span className="font-mono text-[11px] tracking-wide text-fog">
                idam-prime — find your place
              </span>
            </div>
            <span className="mono-sm hidden sm:block">DEMO</span>
          </div>

          {/* app header */}
          <div className="flex flex-col gap-3 border-b border-white/8 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-baseline gap-3">
              <span className="font-display text-xl font-bold tracking-[0.2em] text-snow">IDAM</span>
              <span className="mono-sm hidden sm:inline">find your place.</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {IDAM_TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    stopAuto();
                    setTab(t);
                  }}
                  className={`rounded-sm px-3 py-1.5 font-mono text-[10px] tracking-[0.14em] transition-all duration-300 ${
                    tab === t
                      ? 'bg-electric/18 text-white shadow-[0_0_14px_rgba(63,140,255,0.3)]'
                      : 'text-fog hover:text-snow'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* filters */}
          <div className="grid gap-4 border-b border-white/8 px-5 py-4 lg:grid-cols-3">
            <div>
              <div className="mono-sm mb-2 flex items-center gap-2">
                <MapPin size={11} /> CITY
              </div>
              <div className="flex flex-wrap gap-1.5">
                {IDAM_CITIES.slice(0, 4).map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      stopAuto();
                      setCity(city === c ? null : c);
                    }}
                    className={`chip ${city === c ? 'active' : ''}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="mono-sm mb-2 flex items-center gap-2">
                <Building2 size={11} /> BEDROOMS
              </div>
              <div className="flex flex-wrap gap-1.5">
                {BHK_OPTIONS.map((b) => (
                  <button
                    key={b}
                    onClick={() => {
                      stopAuto();
                      setBhk(bhk === b ? null : b);
                    }}
                    className={`chip ${bhk === b ? 'active' : ''}`}
                  >
                    {b} BHK
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="mono-sm mb-2 flex items-center gap-2">
                <Search size={11} /> BUDGET
              </div>
              <div className="flex flex-wrap gap-1.5">
                {BUDGETS.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      stopAuto();
                      setBudget(budget === b.id ? null : b.id);
                    }}
                    className={`chip ${budget === b.id ? 'active' : ''}`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* results */}
          <div className="relative min-h-[380px] bg-abyss/60 p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="mono-sm">
                SHOWING{' '}
                <span className="text-electric-soft">{results.length}</span>{' '}
                {results.length === 1 ? 'PROPERTY' : 'PROPERTIES'}
              </span>
              {(city || bhk !== null || budget) && (
                <button
                  onClick={() => {
                    stopAuto();
                    setCity(null);
                    setBhk(null);
                    setBudget(null);
                  }}
                  className="mono-sm text-electric-soft hover:text-white"
                >
                  RESET ALL
                </button>
              )}
            </div>

            {results.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
                <Search size={22} className="text-faint" />
                <p className="max-w-xs text-sm text-fog">
                  No matches in this slice of the demo. Loosen a filter — the live app has
                  the full inventory.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {results.map((l) => (
                  <div
                    key={l.id}
                    data-pv-card
                    className="row-in group overflow-hidden rounded-md border border-white/8 bg-navy/70 transition-colors hover:border-electric/40"
                  >
                    <div className="relative h-36 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={l.img}
                        alt={l.name}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent" />
                      <button
                        onClick={() => toggleSave(l.id)}
                        aria-label="Save property"
                        className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-ink/60 backdrop-blur transition-transform hover:scale-110"
                      >
                        <Heart
                          size={14}
                          className={saved.includes(l.id) ? 'fill-electric text-electric' : 'text-white/80'}
                        />
                      </button>
                      {l.verified && (
                        <span className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-ink/70 px-2 py-1 font-mono text-[9px] tracking-wider text-electric-soft backdrop-blur">
                          <ShieldCheck size={10} /> VERIFIED
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-display text-sm font-semibold leading-snug text-snow">
                          {l.name}
                        </div>
                        <div className="whitespace-nowrap font-mono text-sm text-electric-soft">
                          {l.priceLabel}
                        </div>
                      </div>
                      <div className="mono-sm mt-2">
                        {l.bhk > 0 ? `${l.bhk} BHK · ` : ''}
                        {l.type} · {l.area}, {l.city}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <p className="mono-sm mt-6 text-center" data-reveal>
          RECREATED FROM THE LIVE PRODUCT — BUDGET · BEDROOMS · TYPE · FURNISHING · VERIFIED
        </p>
      </div>
    </section>
  );
}

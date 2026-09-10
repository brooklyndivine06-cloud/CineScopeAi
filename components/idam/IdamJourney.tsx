'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowUpRight,
  CalendarCheck2,
  Check,
  Heart,
  MapPin,
  MessageSquare,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import {
  BUDGETS,
  LISTINGS,
  SITE,
  VISIT_SLOTS,
  type BudgetId,
} from '@/lib/site';
import { reducedMotion, scrollToId } from '@/lib/anim';

/* ========================= SEARCH & DISCOVERY ====================== */

const TYPES = ['House', 'Apartment', 'Villa', 'Land', 'PG', 'Commercial'] as const;
const FURNISHING = ['Furnished', 'Semi-furnished', 'Unfurnished'] as const;

export function IdamSearch() {
  const [budget, setBudget] = useState<BudgetId | null>(null);
  const [bhk, setBhk] = useState<number | null>(null);
  const [type, setType] = useState<(typeof TYPES)[number] | null>(null);
  const [furnishing, setFurnishing] = useState<(typeof FURNISHING)[number] | null>(null);
  const [verified, setVerified] = useState(false);
  const rowKey = useRef('');

  const results = useMemo(
    () =>
      LISTINGS.filter((l) => {
        if (budget) {
          const b = BUDGETS.find((x) => x.id === budget)!;
          if (l.price < b.min || l.price >= b.max) return false;
        }
        if (bhk !== null && l.bhk !== bhk) return false;
        if (type && l.type !== type) return false;
        if (furnishing && l.furnishing !== furnishing) return false;
        if (verified && !l.verified) return false;
        return true;
      }),
    [budget, bhk, type, furnishing, verified]
  );

  useEffect(() => {
    const key = [budget, bhk, type, furnishing, verified].join('|');
    if (key === rowKey.current) return;
    rowKey.current = key;
    const rows = document.querySelectorAll<HTMLElement>('[data-sr-row]');
    if (reducedMotion) {
      rows.forEach((r) => r.classList.add('shown'));
      return;
    }
    rows.forEach((r, i) => {
      r.classList.remove('shown');
      window.setTimeout(() => r.classList.add('shown'), 40 + i * 70);
    });
  }, [budget, bhk, type, furnishing, verified]);

  const reset = () => {
    setBudget(null);
    setBhk(null);
    setType(null);
    setFurnishing(null);
    setVerified(false);
  };

  const Group = ({
    label,
    children,
  }: {
    label: string;
    children: React.ReactNode;
  }) => (
    <div>
      <div className="mono-sm mb-3">{label}</div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );

  return (
    <section className="relative py-24 md:py-32">
      <div className="mx-auto w-full max-w-[1400px] px-5 md:px-10">
        <div className="mb-12">
          <div className="mono-tag mb-6" data-reveal>
            SEARCH &amp; DISCOVERY / 06
          </div>
          <h2
            className="font-display text-[clamp(2.2rem,5vw,4rem)] font-bold leading-[1.02] tracking-tight text-snow"
            data-reveal="words"
          >
            Find something that feels right.
          </h2>
          <p className="mt-4 max-w-lg text-fog" data-reveal>
            The filters mirror the live IDAM interface. Compose them and watch the
            fictional inventory respond.
          </p>
        </div>

        <div className="glass grid gap-8 rounded-lg p-6 md:p-8 lg:grid-cols-[0.9fr_1.1fr]" data-reveal>
          {/* filters */}
          <div className="flex flex-col gap-7 border-b border-white/8 pb-8 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-8">
            <Group label="BUDGET">
              {BUDGETS.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setBudget(budget === b.id ? null : b.id)}
                  className={`chip ${budget === b.id ? 'active' : ''}`}
                >
                  {b.label}
                </button>
              ))}
            </Group>
            <Group label="BEDROOMS">
              {[1, 2, 3, 4].map((b) => (
                <button
                  key={b}
                  onClick={() => setBhk(bhk === b ? null : b)}
                  className={`chip ${bhk === b ? 'active' : ''}`}
                >
                  {b} BHK
                </button>
              ))}
            </Group>
            <Group label="PROPERTY TYPE">
              {TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setType(type === t ? null : t)}
                  className={`chip ${type === t ? 'active' : ''}`}
                >
                  {t}
                </button>
              ))}
            </Group>
            <Group label="FURNISHING">
              {FURNISHING.map((f) => (
                <button
                  key={f}
                  onClick={() => setFurnishing(furnishing === f ? null : f)}
                  className={`chip ${furnishing === f ? 'active' : ''}`}
                >
                  {f}
                </button>
              ))}
            </Group>
            <div className="flex items-center justify-between">
              <span className="mono-sm">VERIFIED LISTINGS</span>
              <button
                onClick={() => setVerified(!verified)}
                role="switch"
                aria-checked={verified}
                className={`relative h-6 w-12 rounded-full border transition-colors duration-300 ${
                  verified ? 'border-electric bg-electric/30' : 'border-white/20 bg-ink'
                }`}
              >
                <span
                  className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full transition-all duration-300 ${
                    verified ? 'left-[26px] bg-electric' : 'left-1 bg-fog'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* results */}
          <div className="min-h-[300px]">
            <div className="mb-4 flex items-center justify-between">
              <span className="mono-sm">
                <span className="text-electric-soft">{results.length}</span> MATCHING PROPERT
                {results.length === 1 ? 'Y' : 'IES'}
              </span>
              <button onClick={reset} className="mono-sm text-electric-soft hover:text-white">
                RESET ALL
              </button>
            </div>
            <div className="space-y-2">
              {results.length === 0 && (
                <div className="flex h-48 flex-col items-center justify-center gap-3 text-center">
                  <Search size={20} className="text-faint" />
                  <p className="max-w-[240px] text-sm text-fog">
                    Nothing matches that combination — loosen a filter.
                  </p>
                </div>
              )}
              {results.map((l) => (
                <div
                  key={l.id}
                  data-sr-row
                  className="row-in group flex items-center gap-4 rounded-sm border border-white/6 bg-navy/50 p-3 transition-colors hover:border-electric/30"
                >
                  <div className="h-14 w-20 flex-none overflow-hidden rounded-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={l.img} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-display text-sm font-semibold text-snow">
                      {l.name}
                    </div>
                    <div className="mono-sm mt-1 truncate">
                      {l.bhk > 0 ? `${l.bhk} BHK · ` : ''}
                      {l.type} · {l.area}, {l.city} · {l.furnishing}
                    </div>
                  </div>
                  {l.verified && <ShieldCheck size={14} className="flex-none text-electric-soft" />}
                  <div className="flex-none font-mono text-sm text-electric-soft">{l.priceLabel}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ========================== PROPERTY LAB =========================== */

const FEATURED = LISTINGS[0];
const AMENITIES = ['Covered parking', '24×7 security', 'Backup power', 'Water treatment', 'Lift', 'Gym & pool'];

export function PropertyLab() {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <section className="relative bg-abyss/60 py-24 md:py-32">
      <div className="mx-auto w-full max-w-[1400px] px-5 md:px-10">
        <div className="mb-12">
          <div className="mono-tag mb-6" data-reveal>
            PROPERTY INTERACTION / 07
          </div>
          <h2
            className="font-display text-[clamp(2.2rem,5vw,4rem)] font-bold leading-[1.02] tracking-tight text-snow"
            data-reveal="words"
          >
            A card that behaves like a product.
          </h2>
        </div>

        <div
          className="group/prop relative mx-auto max-w-4xl cursor-pointer overflow-hidden rounded-lg border border-white/10 bg-navy"
          data-reveal="scale"
          data-cursor="view"
          onClick={() => setOpen(true)}
        >
          <div className="relative h-[320px] overflow-hidden md:h-[440px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={FEATURED.img}
              alt={FEATURED.name}
              className="h-full w-full object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/prop:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />

            <div className="absolute left-5 top-5 flex items-center gap-2">
              <span className="chip active cursor-default !py-1.5">FEATURED</span>
              {FEATURED.verified && (
                <span className="flex items-center gap-1.5 rounded-full bg-ink/70 px-3 py-1.5 font-mono text-[10px] tracking-wider text-electric-soft backdrop-blur">
                  <ShieldCheck size={11} /> OWNER VERIFIED
                </span>
              )}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setSaved(!saved);
              }}
              aria-label="Save property"
              className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-ink/60 backdrop-blur transition-all duration-300 hover:scale-110 hover:border-electric/60"
            >
              <Heart
                size={16}
                className={`transition-all duration-300 ${saved ? 'scale-110 fill-electric text-electric' : 'text-white/85'}`}
              />
            </button>

            <div className="absolute inset-x-5 bottom-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="prop-loc mono-sm mb-2 flex items-center gap-1.5 text-electric-soft">
                  <MapPin size={11} /> {FEATURED.area}, {FEATURED.city}
                </div>
                <div className="font-display text-2xl font-semibold tracking-tight text-snow md:text-3xl">
                  {FEATURED.name}
                </div>
                <div className="mono-sm mt-2">
                  {FEATURED.bhk} BHK · {FEATURED.type} · {FEATURED.sqft} · {FEATURED.furnishing}
                </div>
              </div>
              <div className="prop-price font-mono text-2xl text-electric-soft md:text-3xl">
                {FEATURED.priceLabel}
              </div>
            </div>

            <div className="prop-cta absolute bottom-5 left-1/2 hidden -translate-x-1/2 md:block">
              <span className="btn btn-primary !py-3">VIEW PROPERTY</span>
            </div>
          </div>
          <div className="flex items-center justify-between px-5 py-4">
            <span className="mono-sm">TAP / CLICK TO OPEN FULL DETAIL</span>
            <span className="mono-sm text-electric-soft">01 / LIVE DATA</span>
          </div>
        </div>
      </div>

      {/* fullscreen detail */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            className="fixed inset-0 z-[110] overflow-y-auto bg-ink/95 backdrop-blur-xl"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }}
              exit={{ y: 40, opacity: 0, transition: { duration: 0.3 } }}
              className="mx-auto my-6 w-[min(960px,92vw)] overflow-hidden rounded-lg border border-white/12 bg-navy md:my-12"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative h-[260px] md:h-[380px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={FEATURED.img} alt={FEATURED.name} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/20 to-transparent" />
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-ink/70 backdrop-blur transition-colors hover:border-electric"
                >
                  <X size={18} />
                </button>
                <div className="absolute bottom-5 left-6 right-6 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <div className="mono-sm mb-2 flex items-center gap-1.5 text-electric-soft">
                      <MapPin size={11} /> {FEATURED.area}, {FEATURED.city}
                    </div>
                    <h3 className="font-display text-3xl font-semibold tracking-tight text-snow md:text-4xl">
                      {FEATURED.name}
                    </h3>
                  </div>
                  <div className="font-mono text-3xl text-electric-soft">{FEATURED.priceLabel}</div>
                </div>
              </div>

              <div className="grid gap-8 p-6 md:grid-cols-[1.2fr_0.8fr] md:p-8">
                <div>
                  <div className="mb-6 grid grid-cols-3 gap-3">
                    {[
                      { label: 'BEDS', value: `${FEATURED.bhk} BHK` },
                      { label: 'SIZE', value: FEATURED.sqft },
                      { label: 'FURNISHING', value: FEATURED.furnishing.split('-')[0] },
                    ].map((s) => (
                      <div key={s.label} className="border border-white/10 bg-abyss/60 p-3">
                        <div className="mono-sm">{s.label}</div>
                        <div className="mt-1 font-display text-sm font-semibold text-snow">{s.value}</div>
                      </div>
                    ))}
                  </div>
                  <p className="leading-relaxed text-fog">{FEATURED.desc}</p>
                  <div className="mono-sm mb-3 mt-8">INCLUDES</div>
                  <div className="flex flex-wrap gap-2">
                    {AMENITIES.map((a) => (
                      <span key={a} className="chip cursor-default">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  <div className="border border-electric/30 bg-electric/[0.06] p-5">
                    <div className="mono-sm text-electric-soft">NEXT STEP</div>
                    <p className="mt-2 text-sm leading-relaxed text-fog">
                      In the live product this screen opens the enquiry flow — message the
                      owner, request a site visit, or ask about home-loan assistance.
                    </p>
                    <button
                      onClick={() => {
                        setOpen(false);
                        window.setTimeout(() => scrollToId('enquiry'), 300);
                      }}
                      className="btn btn-primary mt-5 w-full"
                    >
                      <MessageSquare size={14} /> SEE THE ENQUIRY FLOW
                    </button>
                  </div>
                  <a href={SITE.idam} target="_blank" rel="noreferrer" className="btn btn-ghost w-full" data-cursor="open">
                    OPEN IN LIVE IDAM <ArrowUpRight size={14} className="btn-arrow" />
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/* =========================== ENQUIRY FLOW ========================== */

const ENQ_STEPS = [
  {
    n: '01',
    title: 'DISCOVER',
    copy: 'Search, filter and open the listing that fits.',
    visual: 'search',
  },
  {
    n: '02',
    title: 'INTERESTED',
    copy: 'Save it, compare it, sit with it. No pressure.',
    visual: 'save',
  },
  {
    n: '03',
    title: 'ENQUIRE',
    copy: 'Send a structured message — with optional flags for a site visit or home-loan assistance.',
    visual: 'enquiry',
  },
  {
    n: '04',
    title: 'SCHEDULE VISIT',
    copy: 'Pick a date and slot. Intention becomes a plan.',
    visual: 'visit',
  },
] as const;

export function EnquiryFlow() {
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (reducedMotion || paused) return;
    const t = window.setInterval(() => setStep((s) => (s + 1) % ENQ_STEPS.length), 2600);
    return () => window.clearInterval(t);
  }, [paused]);

  return (
    <section id="enquiry" className="relative py-24 md:py-32">
      <div className="mx-auto w-full max-w-[1400px] px-5 md:px-10">
        <div className="mb-14">
          <div className="mono-tag mb-6" data-reveal>
            ENQUIRY FLOW / 08
          </div>
          <h2
            className="font-display text-[clamp(2.2rem,5vw,4rem)] font-bold leading-[1.02] tracking-tight text-snow"
            data-reveal="words"
          >
            From “maybe” to “let’s see it.”
          </h2>
        </div>

        <div
          className="relative"
          data-reveal
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* progress rail */}
          <div className="absolute left-0 right-0 top-[30px] hidden h-px bg-white/10 md:block">
            <div
              className="h-px origin-left bg-electric transition-all duration-700"
              style={{ transform: `scaleX(${(step + 1) / ENQ_STEPS.length})`, boxShadow: '0 0 12px rgba(63,140,255,0.6)' }}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            {ENQ_STEPS.map((s, i) => (
              <button
                key={s.n}
                onClick={() => {
                  setPaused(true);
                  setStep(i);
                }}
                className={`relative rounded-md border p-6 text-left transition-all duration-500 ${
                  step === i
                    ? 'border-electric/60 bg-electric/[0.06] shadow-[0_0_40px_rgba(63,140,255,0.1)]'
                    : 'border-white/8 bg-navy/40'
                }`}
              >
                <div className="mb-6 flex items-center gap-3">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full border font-mono text-[10px] transition-all duration-500 ${
                      step === i
                        ? 'border-electric bg-electric text-ink shadow-[0_0_16px_rgba(63,140,255,0.7)]'
                        : step > i
                          ? 'border-electric/50 bg-electric/20 text-electric-soft'
                          : 'border-white/20 text-faint'
                    }`}
                  >
                    {step > i ? <Check size={12} /> : s.n}
                  </span>
                  <span
                    className={`font-display text-lg font-semibold tracking-[0.12em] ${
                      step === i ? 'text-white' : 'text-fog'
                    }`}
                  >
                    {s.title}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-fog">{s.copy}</p>

                {s.visual === 'enquiry' && step === i && (
                  <div className="mt-5 space-y-2">
                    <div className="h-8 rounded-sm border border-white/10 bg-abyss/70" />
                    {[
                      ['Site visit', true],
                      ['Home-loan assistance', true],
                    ].map(([label, on], j) => (
                      <div
                        key={label as string}
                        className="flex items-center gap-2 rounded-sm border border-white/8 bg-abyss/50 px-3 py-2"
                        style={{ transitionDelay: `${j * 120}ms` }}
                      >
                        <span
                          className={`flex h-4 w-4 items-center justify-center rounded-sm border ${
                            on ? 'border-electric bg-electric/30' : 'border-white/20'
                          }`}
                        >
                          {on ? <Check size={10} className="text-electric-soft" /> : null}
                        </span>
                        <span className="font-mono text-[10px] tracking-wider text-fog">
                          {label as string}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {s.visual === 'visit' && step === i && (
                  <div className="mt-5 flex items-center gap-2">
                    <CalendarCheck2 size={15} className="text-electric-soft" />
                    <span className="font-mono text-[10px] tracking-wider text-fog">
                      SAT 12 SEP · 11:00 AM
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="mono-sm mt-8 text-center">
            {paused ? 'PAUSED — CLICK A STAGE' : 'AUTO-CYCLING — HOVER TO INSPECT'}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ========================= VISIT SCHEDULING ======================== */

export function VisitScheduling() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = today.toLocaleString('en', { month: 'long' });
  const week = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const [day, setDay] = useState<number | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const pick = (d: number | null, s: string | null) => {
    setConfirmed(false);
    setDay(d);
    setSlot(s);
    if (d !== null && s !== null && !reducedMotion) {
      window.setTimeout(() => setConfirmed(true), 650);
    } else if (d !== null && s !== null) {
      setConfirmed(true);
    }
  };

  const cells: (number | null)[] = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <section className="relative bg-abyss/60 py-24 md:py-32">
      <div className="mx-auto w-full max-w-[1400px] px-5 md:px-10">
        <div className="mb-12">
          <div className="mono-tag mb-6" data-reveal>
            VISIT SCHEDULING / 09
          </div>
          <h2
            className="font-display text-[clamp(2.2rem,5vw,4rem)] font-bold leading-[1.02] tracking-tight text-snow"
            data-reveal="words"
          >
            Intention becomes a plan.
          </h2>
          <p className="mt-4 max-w-lg text-fog" data-reveal>
            Pick a date and a slot — the confirmation is part of the demo, the flow is
            part of the real product.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]" data-reveal>
          {/* calendar */}
          <div className="glass rounded-lg p-6">
            <div className="mb-5 flex items-center justify-between">
              <span className="font-display text-lg font-semibold text-snow">
                {monthName} {year}
              </span>
              <span className="mono-sm">SELECT DATE</span>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {week.map((d, i) => (
                <div key={i} className="pb-2 text-center font-mono text-[10px] text-faint">
                  {d}
                </div>
              ))}
              {cells.map((d, i) =>
                d === null ? (
                  <div key={`e${i}`} />
                ) : (
                  <button
                    key={d}
                    disabled={d < today.getDate()}
                    onClick={() => pick(d, slot)}
                    className={`cal-day flex aspect-square items-center justify-center rounded-sm border border-transparent font-mono text-xs ${
                      day === d ? 'selected' : 'border-white/10 text-fog'
                    }`}
                  >
                    {d}
                  </button>
                )
              )}
            </div>
          </div>

          {/* slots + confirmation */}
          <div className="flex flex-col gap-6">
            <div className="glass flex-1 rounded-lg p-6">
              <div className="mono-sm mb-4">
                AVAILABLE TIMES {day ? `— ${monthName.toUpperCase()} ${day}` : ''}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {VISIT_SLOTS.map((s) => (
                  <button
                    key={s}
                    onClick={() => pick(day, slot === s ? null : s)}
                    disabled={day === null}
                    className={`chip ${slot === s ? 'active' : ''} ${
                      day === null ? 'cursor-not-allowed opacity-35' : ''
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {day === null && (
                <div className="mono-sm mt-4 text-faint">PICK A DATE FIRST</div>
              )}
            </div>

            <div className="relative min-h-[130px] overflow-hidden rounded-lg border border-electric/25 bg-electric/[0.05] p-6">
              <AnimatePresence mode="wait">
                {confirmed ? (
                  <motion.div
                    key="ok"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }}
                    exit={{ opacity: 0, transition: { duration: 0.2 } }}
                    className="flex items-center gap-5"
                  >
                    <span className="flex h-12 w-12 flex-none items-center justify-center rounded-full border border-electric bg-electric/15">
                      <Check size={20} className="text-electric-soft" />
                    </span>
                    <div>
                      <div className="font-display text-xl font-semibold tracking-[0.14em] text-snow">
                        VISIT REQUESTED
                      </div>
                      <div className="mono-sm mt-1">
                        {monthName.toUpperCase()} {day} · {slot} · {FEATURED.name.toUpperCase()}
                      </div>
                    </div>
                    <button
                      onClick={() => pick(null, null)}
                      className="mono-sm ml-auto text-electric-soft hover:text-white"
                    >
                      RESET
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.2 } }}
                    className="flex h-full items-center"
                  >
                    <span className="mono-sm text-faint">
                      CONFIRMATION APPEARS HERE ONCE DATE + SLOT ARE PICKED
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

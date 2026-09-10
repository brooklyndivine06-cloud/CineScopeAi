'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ArrowUpRight, Check } from 'lucide-react';
import { SITE } from '@/lib/site';
import { reducedMotion } from '@/lib/anim';

/* =========================== OVERVIEW ============================== */

export function IdamOverview() {
  return (
    <section id="work" className="relative overflow-hidden py-24 md:py-36">
      <div className="mx-auto w-full max-w-[1400px] px-5 md:px-10">
        <div className="mono-tag mb-8 flex items-center gap-4" data-reveal>
          <span className="text-electric-soft">SELECTED WORK</span>
          <span className="h-px w-14 bg-electric/50" />
          <span>FLAGSHIP PROJECT</span>
        </div>

        <h2
          className="font-display text-[clamp(5rem,20vw,17rem)] font-bold leading-[0.85] tracking-tight text-snow"
          data-reveal="words"
        >
          IDAM
        </h2>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <h3
              className="font-display text-[clamp(1.8rem,4vw,3.2rem)] font-medium italic leading-tight text-electric-soft"
              data-reveal
            >
              Find your place.
            </h3>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-fog" data-reveal>
              A property discovery platform designed around the experience of finding,
              exploring, and connecting with properties — an India-focused,
              Kerala-rooted digital product where discovery, filtering, communication and
              property visits live in a single interaction flow.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 lg:justify-end" data-reveal>
            <a
              href={SITE.idam}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary"
              data-cursor="open"
            >
              OPEN IDAM <ArrowUpRight size={14} className="btn-arrow" />
            </a>
            <span className="mono-sm hidden sm:block">LIVE / INDIA</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================== PROBLEM =============================== */

export function IdamProblem() {
  return (
    <section className="relative overflow-hidden bg-abyss/70 py-28 md:py-40">
      <div className="mx-auto w-full max-w-[1200px] px-5 text-center md:px-10">
        <div className="mono-tag mb-10" data-reveal>
          THE PROBLEM
        </div>
        <blockquote
          className="font-display text-[clamp(1.7rem,4.4vw,3.4rem)] font-medium leading-[1.25] tracking-tight text-snow"
          data-reveal="words"
        >
          “Finding a property should feel less like searching through noise, and more like
          discovering the right place.”
        </blockquote>
        <p className="mx-auto mt-10 max-w-2xl leading-relaxed text-fog" data-reveal>
          IDAM explores a digital property experience where discovery, filtering,
          communication and property visits are brought into a single interaction flow —
          a design intent for how property search could feel when the interface does the
          heavy lifting.
        </p>
      </div>
    </section>
  );
}

/* ============================ AUTH DEMO ============================ */

type AuthPhase = 'phone' | 'otp' | 'welcome';

export function IdamAuth() {
  const [phase, setPhase] = useState<AuthPhase>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(0);
  const [loop, setLoop] = useState(0);

  useEffect(() => {
    if (reducedMotion) {
      setPhase('phone');
      setPhone('98470 12345');
      return;
    }
    let t1: number, t2: number;
    const run = () => {
      setPhase('phone');
      setPhone('');
      setOtp(0);
      let i = 0;
      const number = '98470 12345';
      t1 = window.setInterval(() => {
        i++;
        setPhone(number.slice(0, i));
        if (i >= number.length) {
          window.clearInterval(t1);
          window.setTimeout(() => setPhase('otp'), 700);
        }
      }, 90);
      t2 = window.setTimeout(() => {
        for (let o = 1; o <= 6; o++) {
          window.setTimeout(() => setOtp(o), 600 + o * 220);
        }
      }, 600);
      window.setTimeout(() => setPhase('welcome'), 600 + 6 * 220 + 900);
      window.setTimeout(run, 600 + 6 * 220 + 900 + 3600);
    };
    run();
    return () => {
      window.clearInterval(t1);
      window.clearTimeout(t2);
    };
  }, [loop]);

  return (
    <section className="relative py-24 md:py-32">
      <div className="mx-auto w-full max-w-[1400px] px-5 md:px-10">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div>
            <div className="mono-tag mb-7" data-reveal>
              AUTHENTICATION / 04
            </div>
            <h2
              className="font-display text-[clamp(2.2rem,5vw,4rem)] font-bold leading-[1.02] tracking-tight text-snow"
              data-reveal="words"
            >
              A login that feels like a product.
            </h2>
            <p className="mt-6 max-w-md leading-relaxed text-fog" data-reveal>
              IDAM signs users in with their phone number and a one-time password — no
              passwords to remember, no friction before discovery. The flow below is a
              live simulation of the real experience.
            </p>
            <div className="mt-8 flex flex-wrap gap-2" data-reveal>
              {['PHONE +91', 'OTP VERIFY', 'WELCOME'].map((s, i) => (
                <span
                  key={s}
                  className={`chip cursor-default ${
                    (phase === 'phone' && i === 0) ||
                    (phase === 'otp' && i === 1) ||
                    (phase === 'welcome' && i === 2)
                      ? 'active'
                      : 'opacity-40'
                  }`}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* phone */}
          <div className="flex justify-center" data-reveal="scale">
            <div className="relative w-[320px] rounded-[28px] border border-white/12 bg-navy p-3 shadow-[0_40px_90px_-40px_rgba(0,0,0,0.9)]">
              <div className="absolute left-1/2 top-3 h-5 w-28 -translate-x-1/2 rounded-b-lg bg-ink" />
              <div className="h-[560px] overflow-hidden rounded-[20px] bg-abyss px-6 pb-6 pt-14">
                <div className="mb-8 text-center">
                  <div className="font-display text-2xl font-bold tracking-[0.18em] text-snow">IDAM</div>
                  <div className="mono-sm mt-1">Find your place.</div>
                </div>

                {phase === 'phone' && (
                  <div className="flex h-full flex-col">
                    <div className="mb-2 font-mono text-xs text-fog">Sign in with your phone number</div>
                    <div className="flex items-center gap-2 border-b border-white/15 pb-3">
                      <span className="font-mono text-base text-snow">+91</span>
                      <span className="font-mono text-base tracking-[0.18em] text-snow">
                        {phone}
                        <span className="caret-blink text-electric">|</span>
                      </span>
                    </div>
                    <div className="mt-6 rounded-sm bg-electric py-3 text-center font-mono text-xs tracking-[0.2em] text-ink">
                      CONTINUE
                    </div>
                    <div className="mt-auto pt-8 text-center">
                      <span className="mono-sm">or continue as guest</span>
                    </div>
                  </div>
                )}

                {phase === 'otp' && (
                  <div className="flex h-full flex-col">
                    <div className="font-mono text-xs text-fog">VERIFY MOBILE NUMBER</div>
                    <div className="mt-3 text-sm text-fog">
                      Enter the 6-digit code sent to <span className="text-snow">+91 {phone}</span>
                    </div>
                    <div className="mt-8 flex justify-between">
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={`flex h-11 w-9 items-center justify-center border font-mono text-lg transition-all duration-300 ${
                            i < otp
                              ? 'border-electric bg-electric/15 text-snow'
                              : 'border-white/15 text-transparent'
                          }`}
                        >
                          {i < otp ? '●' : '●'}
                        </div>
                      ))}
                    </div>
                    <div className="mt-10 rounded-sm border border-electric/50 py-3 text-center font-mono text-xs tracking-[0.2em] text-electric-soft">
                      VERIFY
                    </div>
                  </div>
                )}

                {phase === 'welcome' && (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <div className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-electric/60 bg-electric/10">
                      <Check size={28} className="text-electric-soft" />
                      <span className="absolute inset-0 animate-ping rounded-full border border-electric/30" />
                    </div>
                    <div className="font-display text-2xl font-semibold text-snow">Welcome back.</div>
                    <div className="mono-sm mt-3">+91 {phone} · VERIFIED</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ========================== ENGINEERING ============================= */

const ENG_ROWS = [
  {
    n: '01',
    title: 'FRONTEND',
    desc: 'Responsive interfaces and interactive user flows.',
    more: ['Filterable discovery UI', 'Search & results states', 'Property detail experiences', 'Conversational AI panels'],
  },
  {
    n: '02',
    title: 'DATA',
    desc: 'Property information, user information and saved-property workflows.',
    more: ['Structured listings', 'Saved properties', 'User preferences'],
  },
  {
    n: '03',
    title: 'AUTHENTICATION',
    desc: 'Phone-based login and verification experience.',
    more: ['Phone +91 sign-in', 'OTP verification', 'Guest access path'],
  },
  {
    n: '04',
    title: 'PRODUCT LOGIC',
    desc: 'Property search, filters, enquiries and visit scheduling.',
    more: ['Composable filters', 'Enquiry flows', 'Visit slot scheduling'],
  },
  {
    n: '05',
    title: 'AI EXPERIENCE',
    desc: 'Conversational property guidance through Velappan.',
    more: ['Natural language search', 'Quick actions', 'EMI guidance'],
  },
] as const;

export function IdamEngineering() {
  const [open, setOpen] = useState<string | null>('01');

  return (
    <section className="relative py-24 md:py-32">
      <div className="mx-auto w-full max-w-[1400px] px-5 md:px-10">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <div className="mono-tag mb-7" data-reveal>
              ENGINEERING
            </div>
            <h2
              className="font-display text-[clamp(2.4rem,5vw,4.4rem)] font-bold leading-[1.02] tracking-tight text-snow"
              data-reveal="words"
            >
              Built around interaction.
            </h2>
            <p className="mt-6 max-w-sm leading-relaxed text-fog" data-reveal>
              The engineering is organized around what the user does, not around a stack
              diagram. Every layer exists to make the experience feel direct.
            </p>
            <a
              href={SITE.idam}
              target="_blank"
              rel="noreferrer"
              className="btn btn-ghost mt-10"
              data-reveal
              data-cursor="open"
            >
              SEE IT LIVE <ArrowUpRight size={14} className="btn-arrow" />
            </a>
          </div>

          <div className="flex flex-col" data-reveal>
            {ENG_ROWS.map((r) => (
              <div key={r.n} className="border-b border-white/8 first:border-t">
                <button
                  onClick={() => setOpen(open === r.n ? null : r.n)}
                  className="group flex w-full items-center gap-6 py-6 text-left"
                >
                  <span className="mono-sm w-8 text-electric-soft">{r.n}</span>
                  <span className="font-display text-xl font-semibold tracking-tight text-snow transition-colors group-hover:text-electric-soft md:text-2xl">
                    {r.title}
                  </span>
                  <span className="hidden flex-1 text-sm text-fog md:block">{r.desc}</span>
                  <span
                    className={`ml-auto font-mono text-lg text-fog transition-transform duration-500 ${
                      open === r.n ? 'rotate-45 text-electric' : ''
                    }`}
                  >
                    +
                  </span>
                </button>
                <div
                  className="grid transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{ gridTemplateRows: open === r.n ? '1fr' : '0fr' }}
                >
                  <div className="overflow-hidden">
                    <div className="flex flex-wrap gap-2 pb-6 pl-14 pr-2">
                      {r.more.map((m) => (
                        <span key={m} className="chip cursor-default">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

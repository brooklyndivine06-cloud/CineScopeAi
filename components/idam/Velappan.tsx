'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, Calculator, Home, ListPlus, Send, Sparkles } from 'lucide-react';
import { LISTINGS, SITE, inr } from '@/lib/site';
import { reducedMotion } from '@/lib/anim';

type Msg =
  | { id: number; who: 'bot' | 'user'; type: 'text'; text: string }
  | { id: number; who: 'bot'; type: 'directions'; text: string; chips: string[]; actions: string[] }
  | { id: number; who: 'bot'; type: 'results'; text: string }
  | { id: number; who: 'bot'; type: 'emi'; text: string }
  | { id: number; who: 'bot'; type: 'post'; text: string };

let mid = 0;
const nid = () => ++mid;

type NoId<T> = T extends unknown ? Omit<T, 'id'> : never;

const emi = (principal: number, years = 20, rate = 8.5) => {
  const r = rate / 12 / 100;
  const n = years * 12;
  return Math.round((principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
};

const QUICK = ['2 BHK in Kochi', 'Land in Trivandrum', 'EMI Calculator', 'Post a Property'];

function EmiCard() {
  const [amount, setAmount] = useState(50_00_000);
  const value = emi(amount);
  return (
    <div className="mt-2 rounded-md border border-electric/30 bg-abyss/80 p-4">
      <div className="flex items-center gap-2">
        <Calculator size={14} className="text-electric-soft" />
        <span className="mono-sm text-electric-soft">EMI ESTIMATOR</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {[30_00_000, 50_00_000, 80_00_000, 1_50_00_000].map((a) => (
          <button
            key={a}
            onClick={() => setAmount(a)}
            className={`chip ${amount === a ? 'active' : ''}`}
          >
            {a >= 1_00_00_000 ? `₹${(a / 1_00_00_000).toFixed(1).replace(/\.0$/, '')}Cr` : `₹${Math.round(a / 1_00_000)}L`}
          </button>
        ))}
      </div>
      <div className="mono-sm mt-4">
        LOAN · <span className="text-snow">{inr(amount)}</span> · 20 YRS · 8.5%
      </div>
      <div className="mt-2 font-mono text-2xl text-electric-soft">{inr(value)}<span className="text-sm text-fog"> / month</span></div>
    </div>
  );
}

export function Velappan() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState('');
  const [ran, setRan] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const push = (m: NoId<Msg>) => setMsgs((prev) => [...prev, { ...m, id: nid() } as Msg]);

  const botSay = (m: NoId<Msg>) => {
    setTyping(true);
    window.setTimeout(() => {
      setTyping(false);
      push(m);
    }, reducedMotion ? 150 : 1300);
  };

  const respond = (raw: string) => {
    const t = raw.toLowerCase();
    if (t.includes('emi') || t.includes('loan')) {
      botSay({ who: 'bot', type: 'emi', text: 'Sure — here is a quick EMI estimate. Adjust the loan amount to see how the monthly figure moves.' });
    } else if (t.includes('land') || t.includes('plot')) {
      botSay({
        who: 'bot',
        type: 'directions',
        text: 'Namaskaram! 🙏 Here are a few directions for land and plots.',
        chips: ['Land', 'Thiruvananthapuram', '< ₹50L'],
        actions: ['Search property', 'Calculate EMI', 'Post a property'],
      });
    } else if (t.includes('post')) {
      botSay({ who: 'bot', type: 'post', text: 'Great! The post-a-property flow is in the live app — owners publish listings and reach serious buyers and tenants.' });
    } else {
      botSay({
        who: 'bot',
        type: 'directions',
        text: 'Namaskaram! 🙏 I found a few directions you could explore.',
        chips: ['2 BHK', 'Kochi', '₹30L–₹80L'],
        actions: ['Search property', 'Calculate EMI', 'Post a property'],
      });
    }
  };

  const userSay = (text: string) => {
    push({ who: 'user', type: 'text', text });
    setInput('');
    respond(text);
  };

  /* scripted opening */
  useEffect(() => {
    if (reducedMotion || ran) return;
    setRan(true);
    const t1 = window.setTimeout(() => push({ who: 'bot', type: 'text', text: 'Namaskaram! 🙏 I am Velappan, your personal AI property guide on Idam. How can I assist you today?' }), 900);
    const t2 = window.setTimeout(() => userSay('I’m looking for a 2 BHK in Kochi.'), 2600);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: reducedMotion ? 'auto' : 'smooth' });
  }, [msgs, typing]);

  const replay = () => {
    setMsgs([]);
    setRan(false);
    window.setTimeout(() => setRan(true), 0);
  };

  return (
    <section id="velappan" className="relative overflow-hidden py-24 md:py-32">
      {/* ambient glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2"
        style={{ background: 'radial-gradient(ellipse at top, rgba(63,140,255,0.09), transparent 65%)' }}
      />
      <div className="relative mx-auto w-full max-w-[1400px] px-5 md:px-10">
        <div className="mb-12 grid items-end gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="mono-tag mb-6" data-reveal>
              AI EXPERIENCE / 10
            </div>
            <h2
              className="font-display text-[clamp(3rem,8vw,6.5rem)] font-bold leading-[0.95] tracking-tight text-snow"
              data-reveal="words"
            >
              Meet Velappan<span className="text-electric text-glow">.</span>
            </h2>
            <p className="mt-4 font-display text-xl font-medium text-electric-soft md:text-2xl" data-reveal>
              Your AI property guide.
            </p>
          </div>
          <p className="max-w-md leading-relaxed text-fog lg:justify-self-end" data-reveal>
            In the live product, Velappan helps users search homes and plots, calculates
            EMI, and posts properties — through conversation, not forms. This is a
            simulated version of that interface.
          </p>
        </div>

        {/* chat */}
        <div className="glass mx-auto max-w-3xl overflow-hidden rounded-lg" data-reveal="scale">
          {/* header */}
          <div className="flex items-center gap-3 border-b border-white/8 bg-navy/70 px-5 py-4">
            <div className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-electric/50 bg-electric/10 font-display text-lg font-bold text-electric-soft">
                V
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-navy bg-[#28c840]" />
            </div>
            <div className="flex-1">
              <div className="font-display text-sm font-semibold text-snow">Velappan AI Guide</div>
              <div className="mono-sm">Online · Instant Kerala Property Help</div>
            </div>
            <button
              onClick={replay}
              className="mono-sm border border-white/12 px-3 py-1.5 text-fog transition-colors hover:border-electric/60 hover:text-white"
            >
              ↻ REPLAY
            </button>
          </div>

          {/* messages */}
          <div ref={scrollRef} className="h-[420px] space-y-4 overflow-y-auto bg-abyss/50 px-5 py-6">
            {msgs.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className={`flex ${m.who === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-3 text-sm leading-relaxed ${
                    m.who === 'user'
                      ? 'rounded-br-none bg-electric text-ink'
                      : 'rounded-tl-none border border-white/10 bg-navy text-snow'
                  }`}
                >
                  {m.type === 'text' && <span>{m.text}</span>}

                  {m.type === 'directions' && (
                    <span className="block">
                      <span className="block">{m.text}</span>
                      <span className="mt-3 flex flex-wrap gap-1.5">
                        {m.chips.map((c) => (
                          <span key={c} className="chip active cursor-default !py-1">
                            {c}
                          </span>
                        ))}
                      </span>
                      <span className="mt-3 flex flex-wrap gap-2">
                        {m.actions.map((a) => (
                          <button
                            key={a}
                            onClick={() => respond(a)}
                            className="flex items-center gap-1.5 rounded-sm border border-electric/40 bg-electric/10 px-3 py-1.5 font-mono text-[10px] tracking-wider text-electric-soft transition-colors hover:bg-electric/25 hover:text-white"
                          >
                            {a === 'Search property' ? <Home size={11} /> : a === 'Calculate EMI' ? <Calculator size={11} /> : <ListPlus size={11} />}
                            {a.toUpperCase()}
                          </button>
                        ))}
                      </span>
                    </span>
                  )}

                  {m.type === 'results' && (
                    <span className="block">
                      <span className="block">
                        Opening discovery for <span className="text-electric-soft">2 BHK · Kochi</span> —
                        two matches from the demo inventory:
                      </span>
                      <span className="mt-3 block space-y-2">
                        {LISTINGS.slice(0, 2).map((l) => (
                          <span
                            key={l.id}
                            className="flex items-center justify-between gap-3 rounded-sm border border-white/10 bg-ink/50 px-3 py-2"
                          >
                            <span className="truncate text-xs text-snow">{l.name}</span>
                            <span className="font-mono text-xs text-electric-soft">{l.priceLabel}</span>
                          </span>
                        ))}
                      </span>
                    </span>
                  )}

                  {m.type === 'emi' && (
                    <span className="block">
                      <span className="block">{m.text}</span>
                      <EmiCard />
                    </span>
                  )}

                  {m.type === 'post' && (
                    <span className="block">
                      <span className="block">{m.text}</span>
                      <a
                        href={SITE.idam}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-1.5 font-mono text-[11px] tracking-wider text-electric-soft hover:text-white"
                      >
                        OPEN IDAM <ArrowUpRight size={11} />
                      </a>
                    </span>
                  )}
                </div>
              </motion.div>
            ))}

            {typing && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-lg rounded-tl-none border border-white/10 bg-navy px-4 py-3.5">
                  <span className="typing-dot h-1.5 w-1.5 rounded-full bg-electric-soft" />
                  <span className="typing-dot h-1.5 w-1.5 rounded-full bg-electric-soft" />
                  <span className="typing-dot h-1.5 w-1.5 rounded-full bg-electric-soft" />
                </div>
              </div>
            )}
          </div>

          {/* quick actions + input */}
          <div className="border-t border-white/8 bg-navy/70 px-5 py-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {QUICK.map((q) => (
                <button key={q} onClick={() => userSay(q)} className="chip" disabled={typing}>
                  {q}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (input.trim() && !typing) userSay(input.trim());
              }}
              className="flex items-center gap-3"
            >
              <div className="flex flex-1 items-center gap-2 rounded-sm border border-white/12 bg-ink/70 px-4 py-3 transition-colors focus-within:border-electric/60">
                <Sparkles size={14} className="flex-none text-electric-soft" />
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Velappan — e.g. “I’m looking for a 3 BHK in Kochi”"
                  className="w-full bg-transparent text-sm text-snow outline-none placeholder:text-faint"
                />
              </div>
              <button type="submit" className="btn btn-primary !px-5 !py-3" aria-label="Send" data-cursor="open">
                <Send size={14} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

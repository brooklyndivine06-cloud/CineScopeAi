'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, Check, Send } from 'lucide-react';
import { GithubIcon } from '@/components/brand';
import { SITE } from '@/lib/site';
import { reducedMotion } from '@/lib/anim';

const TOPICS = ['Project', 'Collaboration', 'Idea', 'Just saying hi'];

export function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState(TOPICS[0]);
  const [message, setMessage] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const toastTimer = useRef(0);

  const [flash, setFlash] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setFlash(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setFlash(null), 3200);
  };

  useEffect(() => {
    return () => window.clearTimeout(toastTimer.current);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) {
      showToast('NAME AND MESSAGE ARE REQUIRED');
      return;
    }
    setState('sending');
    const body = `Hi Anugrah,\n\n${message}\n\n— ${name}${email ? ` (${email})` : ''}`;
    window.setTimeout(() => {
      if (SITE.email) {
        window.location.href = `mailto:${SITE.email}?subject=${encodeURIComponent(
          `[Portfolio] ${topic} — ${name}`
        )}&body=${encodeURIComponent(body)}`;
        setState('sent');
        showToast('OPENING YOUR MAIL APP…');
      } else {
        navigator.clipboard?.writeText(body).catch(() => {});
        setState('sent');
        showToast('MESSAGE COPIED — FIND ME ON GITHUB');
      }
    }, reducedMotion ? 100 : 900);
  };

  return (
    <section id="contact" className="relative overflow-hidden pb-10 pt-24 md:pt-36">
      {/* warmer mood */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(900px circle at 50% 0%, rgba(63,140,255,0.1), rgba(255,140,63,0.04) 45%, transparent 70%)',
        }}
      />
      <div className="relative mx-auto w-full max-w-[1400px] px-5 md:px-10">
        <div className="mono-tag mb-10" data-reveal>
          CONTACT / 06
        </div>

        <h2 className="font-display font-bold leading-[0.92] tracking-tight">
          <span
            className="block overflow-hidden pb-1 text-[clamp(3.4rem,11vw,9.5rem)] text-snow"
            data-reveal="words"
          >
            LET'S BUILD
          </span>
          <span
            className="block overflow-hidden pb-2 text-[clamp(3.4rem,11vw,9.5rem)] text-electric text-glow"
            data-reveal="words"
          >
            SOMETHING.
          </span>
        </h2>

        <div className="mt-14 grid gap-14 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="flex flex-col justify-start gap-8" data-reveal>
            <p className="max-w-sm text-lg leading-relaxed text-fog">
              Have an idea, a project, a collaboration — or simply want to talk about
              technology? The door is open.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href={SITE.github} target="_blank" rel="noreferrer" className="btn btn-ghost" data-cursor="open">
                <GithubIcon size={14} /> GITHUB <ArrowUpRight size={13} className="btn-arrow" />
              </a>
              <span className="mono-sm self-center">
                LINKEDIN &amp; EMAIL — COMING SOON
              </span>
            </div>
            <div className="mono-sm flex items-center gap-3">
              <span className="pulse-dot" /> USUALY REPLIES WITHIN 48H
            </div>
          </div>

          {/* form */}
          <form onSubmit={submit} className="flex flex-col gap-6" data-reveal>
            <div className="grid gap-6 sm:grid-cols-2">
              <label className="block">
                <span className="mono-sm">NAME</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2 w-full border-b border-white/15 bg-transparent pb-3 font-display text-lg text-snow outline-none transition-colors placeholder:text-faint focus:border-electric"
                  placeholder="Your name"
                />
              </label>
              <label className="block">
                <span className="mono-sm">EMAIL</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 w-full border-b border-white/15 bg-transparent pb-3 font-display text-lg text-snow outline-none transition-colors placeholder:text-faint focus:border-electric"
                  placeholder="you@example.com"
                />
              </label>
            </div>

            <div>
              <span className="mono-sm">WHAT ARE YOU BUILDING?</span>
              <div className="mt-3 flex flex-wrap gap-2">
                {TOPICS.map((t) => (
                  <button
                    type="button"
                    key={t}
                    onClick={() => setTopic(t)}
                    className={`chip ${topic === t ? 'active' : ''}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <label className="block flex-1">
              <span className="mono-sm">MESSAGE</span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="mt-2 w-full resize-none border-b border-white/15 bg-transparent pb-3 font-display text-lg text-snow outline-none transition-colors placeholder:text-faint focus:border-electric"
                placeholder="Tell me about it…"
              />
            </label>

            <button type="submit" disabled={state === 'sending'} className="btn btn-primary w-full sm:w-auto" data-cursor="open">
              {state === 'sending' ? (
                'PREPARING MESSAGE…'
              ) : (
                <>
                  SEND MESSAGE <Send size={14} className="btn-arrow" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* toast */}
      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="glass fixed bottom-8 left-1/2 z-[130] flex -translate-x-1/2 items-center gap-3 rounded-full px-6 py-3"
          >
            <Check size={14} className="text-electric-soft" />
            <span className="mono-sm text-snow">{flash}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

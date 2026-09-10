'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Award,
  BookOpen,
  Brain,
  Code2,
  Download,
  FlaskConical,
  GraduationCap,
  Layers,
  Plus,
  Sparkles,
  Star,
} from 'lucide-react';
import { CERTIFICATIONS, CURRENTLY_LEARNING, EXPLORING, SITE, TECH } from '@/lib/site';
import { attachTilt } from '@/lib/anim';
import { GithubIcon } from '@/components/brand';

/* ========================= CERTIFICATIONS ========================== */

export function Certifications() {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const els = gridRef.current?.querySelectorAll<HTMLElement>('[data-tilt]');
    if (!els) return;
    const cleanups = [...els].map((el) => attachTilt(el, 5));
    return () => cleanups.forEach((fn) => fn());
  }, []);

  return (
    <section id="certifications" className="relative py-24 md:py-32">
      <div className="mx-auto w-full max-w-[1400px] px-5 md:px-10">
        <div className="mb-14 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mono-tag mb-6" data-reveal>
              CERTIFICATIONS
            </div>
            <h2
              className="font-display text-[clamp(2.4rem,5.5vw,4.6rem)] font-bold leading-[1.02] tracking-tight text-snow"
              data-reveal="words"
            >
              Proof of effort.
            </h2>
          </div>
          <p className="mono-sm max-w-[240px] text-right md:text-left" data-reveal>
            HOVER A CARD — ISSUER AND STAMP REVEAL
          </p>
        </div>

        <div ref={gridRef} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CERTIFICATIONS.map((c, i) => (
            <div
              key={c.title}
              data-tilt
              className="tilt-card cert-card group rounded-sm p-7"
              data-reveal="scale"
            >
              <div className="cert-shine" />
              <div className="tilt-spotlight" />
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-electric/40 bg-electric/10">
                  <Award size={18} className="text-electric-soft" />
                </div>
                <span className="mono-sm">
                  {String(i + 1).padStart(2, '2')} / {String(CERTIFICATIONS.length).padStart(2, '0')}
                </span>
              </div>
              <div className="mt-8 min-h-[72px] font-display text-lg font-semibold leading-snug text-snow">
                {c.title}
              </div>
              <div className="mono-sm mt-4 opacity-70 transition-opacity duration-300 group-hover:opacity-100">
                {c.kind.toUpperCase()}
              </div>
              <div className="mt-6 flex items-end justify-between border-t border-white/10 pt-4">
                <span
                  className="font-mono text-sm tracking-[0.14em] text-electric-soft transition-transform duration-500 group-hover:-translate-y-0.5"
                  style={{ opacity: 0.85 }}
                >
                  {c.issuer.toUpperCase()}
                </span>
                <span
                  className="mono-sm border border-electric/50 px-2 py-1 text-electric-soft transition-all duration-500 group-hover:bg-electric/15"
                  style={{ transform: 'rotate(-4deg)' }}
                >
                  COMPLETED
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ========================= INTERACTIVE RÉSUMÉ ====================== */

const RESUME_SECTIONS = [
  {
    id: 'education',
    icon: GraduationCap,
    title: 'EDUCATION',
    body: (
      <div className="space-y-2 text-sm leading-relaxed text-fog">
        <div>
          <span className="text-snow">B.Tech Computer Science &amp; Engineering</span> — 2024 → Present
        </div>
        <div>Adi Shankara Institute of Engineering and Technology, Kalady, Kerala</div>
        <div className="pt-2 text-faint">Currently learning: {CURRENTLY_LEARNING.join(' · ')}</div>
      </div>
    ),
  },
  {
    id: 'projects',
    icon: FlaskConical,
    title: 'PROJECTS',
    body: (
      <div className="space-y-4 text-sm leading-relaxed text-fog">
        <div>
          <span className="text-snow">IDAM</span> — property discovery platform. Search &amp;
          filters, enquiries, visit scheduling, messages, and Velappan, the AI property guide.
        </div>
        <div>
          <span className="text-snow">CineSense AI</span> — AI-powered movie analysis dashboard
          with verdicts, ratings aggregation and a content-warning system.
        </div>
      </div>
    ),
  },
  {
    id: 'skills',
    icon: Code2,
    title: 'SKILLS',
    body: (
      <div className="text-sm leading-relaxed text-fog">
        {TECH.map((t) => t.name).join(' · ')}
      </div>
    ),
  },
  {
    id: 'certs',
    icon: Award,
    title: 'CERTIFICATIONS',
    body: (
      <div className="space-y-1.5 text-sm leading-relaxed text-fog">
        {CERTIFICATIONS.map((c) => (
          <div key={c.title}>
            {c.title} <span className="text-faint">— {c.issuer}</span>
          </div>
        ))}
      </div>
    ),
  },
] as const;

export function ResumeSection() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <section id="resume" className="relative bg-abyss/60 py-24 md:py-32">
      <div className="mx-auto w-full max-w-[1400px] px-5 md:px-10">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <div className="mono-tag mb-7" data-reveal>
              RÉSUMÉ
            </div>
            <h2
              className="font-display text-[clamp(2.4rem,5vw,4.4rem)] font-bold leading-[1.02] tracking-tight text-snow"
              data-reveal="words"
            >
              The short version, interactively.
            </h2>
            <p className="mt-6 max-w-sm leading-relaxed text-fog" data-reveal>
              View the résumé as a timeline instead of a PDF wall — expand any section. The
              full document is one click away.
            </p>
            <a
              href={SITE.resumePdf}
              download
              className="btn btn-primary mt-10"
              data-reveal
            >
              <Download size={14} /> DOWNLOAD PDF <ArrowUpRight size={14} className="btn-arrow" />
            </a>
          </div>

          <div className="flex flex-col" data-reveal>
            {RESUME_SECTIONS.map((s) => {
              const Icon = s.icon;
              const isOpen = open === s.id;
              return (
                <div key={s.id} className="border-b border-white/8 first:border-t">
                  <button
                    onClick={() => setOpen(isOpen ? null : s.id)}
                    className="group flex w-full items-center gap-5 py-5 text-left"
                  >
                    <Icon
                      size={18}
                      className={`transition-colors ${isOpen ? 'text-electric-soft' : 'text-faint'}`}
                    />
                    <span
                      className={`font-display text-lg font-semibold tracking-[0.14em] transition-colors md:text-xl ${
                        isOpen ? 'text-white' : 'text-fog group-hover:text-snow'
                      }`}
                    >
                      {s.title}
                    </span>
                    <span
                      className={`ml-auto font-mono text-lg transition-transform duration-500 ${
                        isOpen ? 'rotate-45 text-electric' : 'text-faint'
                      }`}
                    >
                      +
                    </span>
                  </button>
                  <div
                    className="grid transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                    style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
                  >
                    <div className="overflow-hidden">
                      <div className="pb-6 pl-10 pr-2">{s.body}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ========================= CURRENTLY EXPLORING ===================== */

const EXPLORE_ICONS = [Layers, Brain, Code2, Sparkles];

export function Exploring() {
  return (
    <section id="exploring" className="relative py-24 md:py-32">
      <div className="mx-auto w-full max-w-[1400px] px-5 md:px-10">
        <div className="mb-14">
          <div className="mono-tag mb-6" data-reveal>
            PERSONAL DIGITAL GARDEN
          </div>
          <h2
            className="font-display text-[clamp(2.4rem,5.5vw,4.6rem)] font-bold leading-[1.02] tracking-tight text-snow"
            data-reveal="words"
          >
            Currently exploring.
          </h2>
          <p className="mt-4 max-w-lg text-fog" data-reveal>
            The current stage is part of the story — these are the directions the next
            project will probably grow from.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {EXPLORING.map((e, i) => {
            const Icon = EXPLORE_ICONS[i];
            return (
              <div
                key={e.title}
                className="group relative overflow-hidden rounded-md border border-white/8 bg-navy/50 p-7 transition-colors duration-500 hover:border-electric/40"
                data-reveal="scale"
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
                  style={{ background: 'radial-gradient(300px circle at 50% 0%, rgba(63,140,255,0.08), transparent 60%)' }}
                />
                <Icon size={20} className="text-electric-soft transition-transform duration-500 group-hover:-translate-y-1" />
                <h3 className="mt-8 font-display text-xl font-semibold tracking-tight text-snow">
                  {e.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-fog">{e.copy}</p>
                <div className="mono-sm mt-6 flex items-center gap-2">
                  <span className="h-px w-6 bg-electric/50 transition-all duration-500 group-hover:w-10" />
                  GROWING
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ========================= BEYOND THE STACK ======================== */

export function BeyondStack() {
  const word = 'LEARN → BUILD → BREAK → UNDERSTAND → IMPROVE → REPEAT → ';
  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      <div className="mx-auto mb-12 w-full max-w-[1400px] px-5 md:px-10">
        <div className="mono-tag mb-6" data-reveal>
          BEYOND THE RÉSUMÉ
        </div>
        <h2
          className="font-display text-[clamp(2.4rem,5.5vw,4.6rem)] font-bold leading-[1.02] tracking-tight text-snow"
          data-reveal="words"
        >
          More than the stack.
        </h2>
        <p className="mono-sm mt-6" data-reveal>
          CURIOSITY · PROBLEM SOLVING · EXPERIMENTATION · LEARNING · BUILDING
        </p>
      </div>

      <div className="marquee border-y border-white/6 py-6" data-reveal>
        <div className="marquee-track">
          {[0, 1].map((i) => (
            <span
              key={i}
              className="outline-text whitespace-nowrap px-4 font-display text-[clamp(3rem,8vw,6.5rem)] font-bold leading-none"
            >
              {word + word}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================== GITHUB ============================= */

interface GhUser {
  login: string;
  avatar_url: string;
  name: string | null;
  bio: string | null;
  followers: number;
  public_repos: number;
  html_url: string;
}
interface GhRepo {
  name: string;
  description: string | null;
  stargazers_count: number;
  language: string | null;
  html_url: string;
  updated_at: string;
}

export function GithubSection() {
  const [user, setUser] = useState<GhUser | null>(null);
  const [repos, setRepos] = useState<GhRepo[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    Promise.all([
      fetch(`https://api.github.com/users/${SITE.githubUser}`).then((r) =>
        r.ok ? r.json() : Promise.reject(new Error('user'))
      ),
      fetch(`https://api.github.com/users/${SITE.githubUser}/repos?per_page=10&sort=updated`)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('repos')))),
    ])
      .then(([u, rs]) => {
        if (!live) return;
        setUser(u as GhUser);
        setRepos((rs as GhRepo[]).slice(0, 4));
      })
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, []);

  return (
    <section id="github" className="relative bg-abyss/60 py-24 md:py-32">
      <div className="mx-auto w-full max-w-[1400px] px-5 md:px-10">
        <div className="mb-14">
          <div className="mono-tag mb-6" data-reveal>
            OPEN SOURCE
          </div>
          <h2
            className="font-display text-[clamp(2.4rem,5.5vw,4.6rem)] font-bold leading-[1.02] tracking-tight text-snow"
            data-reveal="words"
          >
            Code in the open.
          </h2>
          <p className="mt-4 max-w-md text-fog" data-reveal>
            Live data from the GitHub API — the numbers below are real and update
            automatically.
          </p>
        </div>

        {failed ? (
          <div className="glass max-w-lg rounded-md p-8" data-reveal>
            <p className="text-fog">
              GitHub data couldn’t load right now (the public API may be rate-limited).
            </p>
            <a
              href={SITE.github}
              target="_blank"
              rel="noreferrer"
              className="btn btn-ghost mt-6"
              data-cursor="open"
            >
              <GithubIcon size={14} /> OPEN GITHUB PROFILE <ArrowUpRight size={14} className="btn-arrow" />
            </a>
          </div>
        ) : !user ? (
          <div className="flex items-center gap-4 py-10" data-reveal>
            <span className="pulse-dot" />
            <span className="mono-sm">CONNECTING TO GITHUB API…</span>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]" data-reveal>
            {/* profile card */}
            <div className="glass flex flex-col rounded-md p-8">
              <div className="flex items-center gap-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={user.avatar_url}
                  alt={user.login}
                  className="h-16 w-16 rounded-full border border-white/15"
                />
                <div>
                  <div className="font-display text-xl font-semibold text-snow">
                    {user.name || user.login}
                  </div>
                  <a
                    href={user.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mono-sm text-electric-soft hover:text-white"
                  >
                    @{user.login} ↗
                  </a>
                </div>
              </div>
              <p className="mt-6 min-h-[40px] text-sm leading-relaxed text-fog">
                {user.bio || 'Building digital experiences — web, AI, and products people can use.'}
              </p>
              <div className="mt-8 grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
                <div>
                  <div className="font-mono text-2xl text-electric-soft">{user.public_repos}</div>
                  <div className="mono-sm mt-1">PUBLIC REPOS</div>
                </div>
                <div>
                  <div className="font-mono text-2xl text-electric-soft">{user.followers}</div>
                  <div className="mono-sm mt-1">FOLLOWERS</div>
                </div>
              </div>
            </div>

            {/* repos */}
            <div className="flex flex-col gap-3">
              {repos.map((r) => (
                <a
                  key={r.name}
                  href={r.html_url}
                  target="_blank"
                  rel="noreferrer"
                  className="group glass flex items-start justify-between gap-4 rounded-md p-5 transition-colors hover:border-electric/40"
                  data-cursor="open"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-snow transition-colors group-hover:text-electric-soft">
                        {r.name}
                      </span>
                      <ArrowUpRight size={12} className="text-faint opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    <p className="mt-1.5 truncate text-sm text-fog">{r.description || '—'}</p>
                    <div className="mono-sm mt-3 flex items-center gap-4">
                      {r.language && (
                        <span className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-electric-soft" />
                          {r.language}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Star size={10} /> {r.stargazers_count}
                      </span>
                    </div>
                  </div>
                </a>
              ))}
              <a
                href={SITE.github}
                target="_blank"
                rel="noreferrer"
                className="mono-sm mt-2 flex items-center gap-2 text-electric-soft hover:text-white"
              >
                VIEW ALL REPOSITORIES <ArrowUpRight size={12} />
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* =========================== FUTURE EXPERIMENTS ==================== */

export function FutureSection() {
  return (
    <section id="future" className="relative py-24 md:py-32">
      <div className="mx-auto w-full max-w-[1400px] px-5 md:px-10">
        <div className="mono-tag mb-10" data-reveal>
          FUTURE EXPERIMENTS
        </div>

        <div
          className="group relative overflow-hidden rounded-lg border border-dashed border-white/15 bg-navy/30 p-10 transition-colors duration-700 hover:border-electric/50 md:p-16"
          data-reveal="scale"
        >
          {/* empty slot grid revealed on hover */}
          <div
            className="pointer-events-none absolute inset-0 grid grid-cols-3 gap-4 p-10 opacity-0 transition-opacity duration-700 group-hover:opacity-100 md:p-16"
            aria-hidden
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="flex items-center justify-center border border-dashed border-white/10"
              >
                <Plus size={18} className="text-faint" />
              </div>
            ))}
          </div>

          <div className="relative">
            <div className="flex items-center gap-3">
              <span className="pulse-dot" />
              <span className="mono-tag">NEXT EXPERIMENT</span>
            </div>
            <h2 className="mt-6 font-display text-[clamp(3rem,8vw,6.5rem)] font-bold leading-[0.95] tracking-tight text-snow">
              Coming soon.
            </h2>
            <p className="mt-5 max-w-md text-lg text-fog" data-reveal>
              Another idea is already taking shape. When it ships, this slot fills — no
              redesign required.
            </p>
            <div className="mono-sm mt-10 flex items-center gap-3">
              <BookOpen size={13} /> THE NEXT IDEA HASN’T SHIPPED YET
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

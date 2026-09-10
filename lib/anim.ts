/* ------------------------------------------------------------------ */
/*  Motion infrastructure: Lenis smooth scroll + GSAP ScrollTrigger,   */
/*  word splitting and reveal registrations.                           */
/* ------------------------------------------------------------------ */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;
let inited = false;

export const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Smooth-scroll to a section id (respects Lenis when active). */
export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset: -70, duration: 1.4 });
  else el.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
}

/** Split an element's text nodes into word spans for clip reveals. */
export function splitWords(el: HTMLElement) {
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node as Text).textContent ?? '';
      if (!text.trim()) return;
      const frag = document.createDocumentFragment();
      text.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          frag.appendChild(document.createTextNode(part));
        } else {
          const w = document.createElement('span');
          w.className = 'rv-w';
          const i = document.createElement('span');
          i.className = 'rv-wi';
          i.textContent = part;
          w.appendChild(i);
          frag.appendChild(w);
        }
      });
      node.parentNode?.replaceChild(frag, node);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      [...(node as Element).childNodes].forEach(walk);
    }
  };
  [...el.childNodes].forEach(walk);
}

export function getWords(el: HTMLElement): HTMLElement[] {
  return [...el.querySelectorAll<HTMLElement>('.rv-wi')];
}

/** Register every [data-reveal] element in the document. */
function registerReveals() {
  if (reducedMotion) return;

  document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
    const mode = el.dataset.reveal || 'up';
    const base = {
      scrollTrigger: { trigger: el, start: 'top 86%', once: true },
      ease: 'power3.out' as const,
    };

    if (mode === 'words') {
      splitWords(el);
      gsap.from(getWords(el), {
        yPercent: 120,
        duration: 0.9,
        stagger: 0.05,
        ...base,
      });
    } else if (mode === 'scrub-words') {
      splitWords(el);
      gsap.from(getWords(el), {
        yPercent: 130,
        opacity: 0.25,
        duration: 1,
        stagger: { each: 0.08, from: 'start' },
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          end: 'bottom 55%',
          scrub: 0.6,
        },
      });
    } else if (mode === 'line') {
      gsap.from(el, {
        scaleX: 0,
        transformOrigin: 'left center',
        duration: 1.2,
        ...base,
      });
    } else if (mode === 'line-scrub') {
      const bar = el.querySelector<HTMLElement>('[data-line-bar]');
      if (bar) {
        gsap.from(bar, {
          scaleX: 0,
          transformOrigin: 'left center',
          scrollTrigger: {
            trigger: el,
            start: 'top 80%',
            end: 'center 40%',
            scrub: 0.8,
          },
        });
      }
    } else if (mode === 'scale') {
      gsap.from(el, { scale: 0.94, opacity: 0, duration: 1, ...base });
    } else if (mode === 'left') {
      gsap.from(el, { x: -36, opacity: 0, duration: 0.9, ...base });
    } else if (mode === 'right') {
      gsap.from(el, { x: 36, opacity: 0, duration: 0.9, ...base });
    } else {
      gsap.from(el, { y: 30, opacity: 0, duration: 0.9, ...base });
    }
  });
}

/** Initialize the whole motion system once. */
export function initMotion() {
  if (typeof window === 'undefined' || inited) return;
  inited = true;

  if (!reducedMotion) {
    lenis = new Lenis({
      lerp: 0.09,
      smoothWheel: true,
      wheelMultiplier: 1,
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis?.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  registerReveals();

  // keep scrolltrigger in sync after fonts / images settle
  window.addEventListener('load', () => ScrollTrigger.refresh());
  setTimeout(() => ScrollTrigger.refresh(), 1200);
}

export function getLenis() {
  return lenis;
}

/** Small 3D tilt helper for cards (subtle). */
export function attachTilt(el: HTMLElement, max = 7) {
  if (reducedMotion || !window.matchMedia('(pointer: fine)').matches) return () => {};
  const onMove = (e: MouseEvent) => {
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    gsap.to(el, {
      rotationY: x * max,
      rotationX: y * -max,
      transformPerspective: 700,
      duration: 0.5,
      ease: 'power2.out',
    });
    el.style.setProperty('--sx', `${(x + 0.5) * 100}%`);
    el.style.setProperty('--sy', `${(y + 0.5) * 100}%`);
  };
  const onLeave = () => {
    gsap.to(el, { rotationY: 0, rotationX: 0, duration: 0.8, ease: 'power2.out' });
  };
  el.addEventListener('mousemove', onMove);
  el.addEventListener('mouseleave', onLeave);
  return () => {
    el.removeEventListener('mousemove', onMove);
    el.removeEventListener('mouseleave', onLeave);
  };
}

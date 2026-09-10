import type { Metadata, Viewport } from 'next';
import './globals.css';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  metadataBase: new URL('https://cinescopeai.fr'),
  title: `${SITE.name} — CSE Student · Building Digital Experiences`,
  description:
    'Portfolio of Anugrah A — Computer Science & Engineering student at Adi Shankara Institute of Engineering and Technology. Web development, AI, and IDAM, a property discovery platform.',
  applicationName: SITE.name,
  keywords: [
    'Anugrah A',
    'portfolio',
    'computer science',
    'web developer',
    'IDAM',
    'AI',
    'Kerala',
  ],
  openGraph: {
    title: `${SITE.name} — Building Digital Experiences`,
    description:
      'CSE student. Web development, AI, and IDAM — a property discovery platform built from an idea into an interactive product.',
    type: 'website',
    locale: 'en_IN',
    siteName: SITE.name,
    images: [{ url: '/images/hero-panel.jpg', width: 1440, height: 810, alt: 'ANUGRAH A — portfolio' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE.name} — Building Digital Experiences`,
    description: 'CSE student. Web development, AI, and the IDAM property discovery platform.',
    images: ['/images/hero-panel.jpg'],
  },
  robots: { index: true, follow: true },
  icons: { icon: '/icon.svg' },
};

export const viewport: Viewport = {
  themeColor: '#05070c',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <link rel="manifest" href="/manifest.json" />
        <div className="grain-overlay" aria-hidden />
        {children}
      </body>
    </html>
  );
}

import './globals.css';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { AppShell } from '@/components/layout/AppShell';

const geistSans = Geist({
  variable: '--font-geist',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Inkloom Guardian — Deterministic Brand Governance & Audit Ledger',
    template: '%s | Inkloom Guardian',
  },
  description: 'Deterministic brand governance engine that verifies marketing copy against versioned rules and approved facts with cryptographic audit logs.',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="bg-paper text-ink antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Inkloom Guardian',
  description: 'Brand governance quality checks before publishing.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

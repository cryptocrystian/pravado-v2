import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ErrorBoundary } from './ErrorBoundary';

// Force dynamic rendering to avoid SSG errors
export const dynamic = 'force-dynamic';

// Inter font - Pravado Design System primary font
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Pravado Dashboard',
  description: 'AI-powered PR, content, and SEO orchestration platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${inter.variable}`} suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased bg-[#0A0A0F]">
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  );
}

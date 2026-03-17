import type { ReactNode } from 'react';

interface LegalDocProps {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}

export function LegalDoc({ title, lastUpdated, children }: LegalDocProps) {
  return (
    <article>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
        <p className="text-xs" style={{ color: '#3D3D4A' }}>
          Last updated: {lastUpdated}
        </p>
      </header>
      <div
        className="legal-content space-y-6 text-sm leading-relaxed"
        style={{ color: '#A0A0B0' }}
      >
        {children}
      </div>
    </article>
  );
}

export function H2({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-xl font-semibold text-white mt-10 mb-4">{children}</h2>
  );
}

export function H3({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-base font-semibold text-white mt-6 mb-2">
      {children}
    </h3>
  );
}

export function P({ children }: { children: ReactNode }) {
  return <p className="mb-3">{children}</p>;
}

export function LegalLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a href={href} className="hover:underline" style={{ color: '#00D9FF' }}>
      {children}
    </a>
  );
}

export function UL({ children }: { children: ReactNode }) {
  return <ul className="list-disc pl-5 space-y-1.5 mb-3">{children}</ul>;
}

export function HR() {
  return <hr className="my-8" style={{ borderColor: '#1F1F28' }} />;
}

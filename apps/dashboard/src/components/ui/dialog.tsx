"use client";

import * as React from "react";

export function Dialog({ children, open, onOpenChange }: { children: React.ReactNode; open?: boolean; onOpenChange?: (open: boolean) => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange?.(false)} />
      <div className="relative z-50">{children}</div>
    </div>
  );
}

export function DialogTrigger({ children, asChild: _asChild }: { children: React.ReactNode; asChild?: boolean }) {
  return <>{children}</>;
}

export function DialogContent({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 max-w-lg w-full mx-4 ${className}`}>
      {children}
    </div>
  );
}

export function DialogHeader({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mb-4 ${className}`}>{children}</div>;
}

export function DialogFooter({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex justify-end gap-2 mt-6 ${className}`}>{children}</div>;
}

export function DialogTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`text-lg font-semibold ${className}`}>{children}</h2>;
}

export function DialogDescription({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-sm text-gray-500 mt-1 ${className}`}>{children}</p>;
}

export function DialogClose({ children, onClick, className = "" }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return <button onClick={onClick} className={className}>{children}</button>;
}

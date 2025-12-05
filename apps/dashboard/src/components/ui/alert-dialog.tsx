"use client";

import * as React from "react";

export function AlertDialog({ children, open: _open, onOpenChange: _onOpenChange }: { children: React.ReactNode; open?: boolean; onOpenChange?: (open: boolean) => void }) {
  return <>{children}</>;
}

export function AlertDialogTrigger({ children, asChild: _asChild }: { children: React.ReactNode; asChild?: boolean }) {
  return <>{children}</>;
}

export function AlertDialogContent({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`hidden ${className}`}>{children}</div>;
}

export function AlertDialogHeader({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export function AlertDialogFooter({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex gap-2 ${className}`}>{children}</div>;
}

export function AlertDialogTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`text-lg font-semibold ${className}`}>{children}</h2>;
}

export function AlertDialogDescription({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-sm text-gray-500 ${className}`}>{children}</p>;
}

export function AlertDialogAction({ children, onClick, className = "" }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return <button onClick={onClick} className={className}>{children}</button>;
}

export function AlertDialogCancel({ children, onClick, className = "" }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return <button onClick={onClick} className={className}>{children}</button>;
}

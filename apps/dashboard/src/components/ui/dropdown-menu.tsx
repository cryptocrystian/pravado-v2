"use client";

import * as React from "react";

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function DropdownMenuTrigger({ children, asChild: _asChild }: { children: React.ReactNode; asChild?: boolean }) {
  return <>{children}</>;
}

export function DropdownMenuContent({ children, className = "" }: { children: React.ReactNode; className?: string; align?: string; sideOffset?: number }) {
  return <div className={`hidden ${className}`}>{children}</div>;
}

export function DropdownMenuItem({ children, onClick, className = "", asChild: _asChild }: { children: React.ReactNode; onClick?: () => void; className?: string; asChild?: boolean }) {
  return <button onClick={onClick} className={`block w-full text-left px-2 py-1 ${className}`}>{children}</button>;
}

export function DropdownMenuLabel({ children }: { children: React.ReactNode }) {
  return <div className="px-2 py-1 text-sm font-semibold">{children}</div>;
}

export function DropdownMenuSeparator() {
  return <div className="h-px bg-gray-200 my-1" />;
}

export function DropdownMenuCheckboxItem({ children, checked, onCheckedChange }: { children: React.ReactNode; checked?: boolean; onCheckedChange?: (checked: boolean) => void }) {
  return <button className="flex items-center px-2 py-1" onClick={() => onCheckedChange?.(!checked)}>{children}</button>;
}

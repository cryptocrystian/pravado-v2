"use client";

import * as React from "react";

export interface CollapsibleProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

export function Collapsible({ open: _open = false, onOpenChange: _onOpenChange, children, className = "" }: CollapsibleProps) {
  return <div className={className}>{children}</div>;
}

export function CollapsibleTrigger({ children, className = "", asChild: _asChild }: { children: React.ReactNode; className?: string; asChild?: boolean }) {
  return <button className={className}>{children}</button>;
}

export function CollapsibleContent({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

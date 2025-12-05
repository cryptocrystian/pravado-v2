"use client";

import * as React from "react";

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function Tooltip({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function TooltipTrigger({ children, asChild: _asChild }: { children: React.ReactNode; asChild?: boolean }) {
  return <>{children}</>;
}

export function TooltipContent({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`hidden ${className}`}>{children}</div>;
}

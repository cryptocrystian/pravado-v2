"use client";

import * as React from "react";

export function ScrollArea({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return <div className={`overflow-auto ${className}`} style={style}>{children}</div>;
}

export function ScrollBar() {
  return null;
}

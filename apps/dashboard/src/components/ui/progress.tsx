"use client";

import * as React from "react";

export interface ProgressProps {
  value?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function Progress({ value = 0, className = "", style }: ProgressProps) {
  return (
    <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`} style={style}>
      <div
        className="bg-blue-600 h-2 rounded-full transition-all"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

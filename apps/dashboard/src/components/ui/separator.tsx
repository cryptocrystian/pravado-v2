"use client";

import * as React from "react";

export interface SeparatorProps {
  orientation?: "horizontal" | "vertical";
  className?: string;
}

export function Separator({ orientation = "horizontal", className = "" }: SeparatorProps) {
  return (
    <div
      className={`${
        orientation === "horizontal" ? "h-px w-full" : "w-px h-full"
      } bg-gray-200 ${className}`}
    />
  );
}

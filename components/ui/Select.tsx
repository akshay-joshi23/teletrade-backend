"use client";
import * as React from "react";

export default function Select({ className = "", ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const base =
    "w-full rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-zinc-900 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/70";
  return <select className={`${base} ${className}`} {...props} />;
}



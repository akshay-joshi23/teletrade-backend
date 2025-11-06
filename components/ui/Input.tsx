"use client";
import * as React from "react";

export default function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  const base =
    "w-full rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-zinc-900 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/70";
  return <input className={`${base} ${className}`} {...props} />;
}



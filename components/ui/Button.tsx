import * as React from "react";
import { cn } from "@/lib/cn";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" };

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className = "", variant = "primary", ...props }, ref) => {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition focus:outline-none focus:ring-2";
  const styles =
    variant === "primary"
      ? "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-400/60 disabled:opacity-50"
      : "text-zinc-800 dark:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5 focus:ring-zinc-400/50";
  return <button ref={ref} className={cn(base, styles, className)} {...props} />;
});

Button.displayName = "Button";

export default Button;



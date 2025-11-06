import * as React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center rounded-xl font-medium focus:outline-none focus:ring-2 disabled:opacity-50 transition";
    const variantCls =
      variant === "primary"
        ? "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-400/70"
        : "bg-transparent text-zinc-900 dark:text-zinc-100 hover:bg-zinc-900/5 dark:hover:bg-white/5 border border-black/10 dark:border-white/15";
    const sizeCls =
      size === "sm" ? "px-3 py-1.5 text-sm" : size === "lg" ? "px-6 py-3 text-base" : "px-4 py-2.5 text-sm";

    return <button ref={ref} className={`${base} ${variantCls} ${sizeCls} ${className}`} {...props} />;
  },
);

Button.displayName = "Button";

export default Button;



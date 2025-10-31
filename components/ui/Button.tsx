import * as React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", ...props }, ref) => {
    const variantCls = variant === "primary" ? "tt-btn-primary" : "tt-btn-secondary";
    const sizeCls =
      size === "sm" ? "px-3 py-1.5 text-sm" : size === "lg" ? "px-6 py-3 text-base" : "px-5 py-2.5 text-sm";

    return (
      <button ref={ref} className={`${variantCls} ${sizeCls} ${className}`} {...props} />
    );
  },
);

Button.displayName = "Button";

export default Button;



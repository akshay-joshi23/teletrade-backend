"use client";
import * as React from "react";

type ToggleProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> & {
  pressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
};

export const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
  ({ className = "", pressed = false, onPressedChange, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        aria-pressed={pressed}
        className={`tt-btn ${pressed ? "bg-black text-white dark:bg-white dark:text-black" : "border border-black/15 dark:border-white/20"} ${className}`}
        onClick={(e) => {
          props.onClick?.(e);
          onPressedChange?.(!pressed);
        }}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Toggle.displayName = "Toggle";

export default Toggle;



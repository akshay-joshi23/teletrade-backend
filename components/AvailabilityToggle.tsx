"use client";
import * as React from "react";
import { Toggle } from "./ui/Toggle";

type AvailabilityToggleProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  id?: string;
  pressed?: boolean;
};

export const AvailabilityToggle: React.FC<AvailabilityToggleProps> = ({
  id = "pro-availability-toggle",
  pressed = false,
  className = "",
  children,
  ...props
}) => {
  return (
    <Toggle id={id} aria-label="Availability" pressed={pressed} className={className} {...props}>
      {children ?? (pressed ? "Available" : "Unavailable")}
    </Toggle>
  );
};

export default AvailabilityToggle;



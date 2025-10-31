import * as React from "react";

type ZipInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  id?: string;
};

export const ZipInput: React.FC<ZipInputProps> = ({ id = "zip-input", className = "", ...props }) => {
  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      pattern="[0-9]{5}"
      placeholder="ZIP code"
      className={`w-full rounded-lg border border-black/15 dark:border-white/20 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/40 dark:focus:ring-white/40 ${className}`}
      {...props}
    />
  );
};

export default ZipInput;



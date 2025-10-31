import * as React from "react";

type TradePickerProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  id?: string;
};

export const TradePicker: React.FC<TradePickerProps> = ({ id = "trade-select", className = "", ...props }) => {
  return (
    <select
      id={id}
      className={`w-full rounded-lg border border-black/15 dark:border-white/20 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/40 dark:focus:ring-white/40 ${className}`}
      {...props}
    >
      <option value="">Select a trade</option>
      <option value="plumber">Plumber</option>
      <option value="electrician">Electrician</option>
      <option value="hvac">HVAC</option>
      <option value="appliance">Appliance</option>
      <option value="handyman">Handyman</option>
    </select>
  );
};

export default TradePicker;



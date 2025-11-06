export function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300 px-2.5 py-1 text-xs font-medium">
      {children}
    </span>
  );
}



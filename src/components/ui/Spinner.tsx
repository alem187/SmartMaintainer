export function Spinner({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <div
      className={`border-2 border-current/30 border-t-current rounded-full animate-spin ${className}`}
    />
  );
}

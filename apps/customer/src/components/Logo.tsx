import { tenant } from "../tenant.generated";

export function Logo({ className = "" }: { className?: string }) {
  // Placeholder: tenant initials in a primary-colored circle.
  // Replaced with real logo asset in build pipeline (PR #4).
  const initials = tenant.displayName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary text-primary-foreground text-2xl font-bold ${className}`}
      aria-label={`${tenant.displayName} logo`}
    >
      {initials}
    </div>
  );
}
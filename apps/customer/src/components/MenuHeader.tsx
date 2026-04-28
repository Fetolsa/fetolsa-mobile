import { tenant } from "../tenant.generated";

export function MenuHeader() {
  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-primary/20">
      <div className="container flex items-center justify-center h-14 px-4">
        <h1 className="font-display text-2xl text-primary tracking-wider uppercase">
          {tenant.displayName}
        </h1>
      </div>
    </header>
  );
}
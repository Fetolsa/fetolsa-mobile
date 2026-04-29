import { tenant } from "../tenant.generated";

export function MenuHeader() {
  return (
    <header
      style={{ backgroundColor: "#faf7f2", borderColor: "#ebe6dd" }}
      className="sticky top-0 z-30 backdrop-blur-sm border-b"
    >
      <div className="container max-w-md mx-auto flex items-center justify-center h-14 px-4">
        <h1
          style={{ color: "#1a1a1a", letterSpacing: "0.08em" }}
          className="font-display text-2xl uppercase"
        >
          {tenant.displayName}
        </h1>
      </div>
    </header>
  );
}
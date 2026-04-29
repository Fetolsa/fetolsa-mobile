import { Search } from "lucide-react";
import { tenant } from "../tenant.generated";

interface Props {
  onSearchOpen: () => void;
}

export function MenuHeader({ onSearchOpen }: Props) {
  return (
    <header
      style={{ backgroundColor: "#faf7f2", borderColor: "#ebe6dd" }}
      className="sticky top-0 z-30 backdrop-blur-sm border-b"
    >
      <div className="container max-w-md mx-auto flex items-center justify-between h-14 px-4">
        <div className="w-10" />
        <h1
          style={{ color: "#1a1a1a", letterSpacing: "0.08em" }}
          className="font-display text-2xl uppercase"
        >
          {tenant.displayName}
        </h1>
        <button
          onClick={onSearchOpen}
          style={{ color: "#1a1a1a" }}
          className="w-10 h-10 flex items-center justify-center hover:bg-muted rounded-lg transition-colors"
          aria-label="Search menu"
        >
          <Search className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
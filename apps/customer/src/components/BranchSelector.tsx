import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useBranch } from "../context/BranchContext";
import type { Branch } from "../types/menu";

interface Props {
  branches: Branch[];
}

export function BranchSelector({ branches }: Props) {
  const [open, setOpen] = useState(false);
  const { branch, setBranch } = useBranch();

  if (branches.length === 0) return null;

  return (
    <div className="sticky top-14 z-30 bg-background/95 backdrop-blur-sm border-b border-primary/20">
      <div className="container px-4 py-2 flex items-center gap-3">
        <span className="text-sm text-muted-foreground font-condensed uppercase tracking-wide shrink-0">
          Branch:
        </span>
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1 bg-muted rounded-lg px-3 py-1.5 text-sm font-condensed font-semibold text-foreground hover:bg-muted/80 transition-colors"
          >
            {branch || "Select Branch"}
            <ChevronDown className="w-4 h-4 text-primary" />
          </button>
          {open && (
            <div className="absolute top-full left-0 mt-1 bg-card border border-primary/20 rounded-lg shadow-lg overflow-hidden z-10 min-w-[180px]">
              {branches.map((b) => (
                <button
                  key={b.name}
                  onClick={() => {
                    setBranch(b.name);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm font-condensed hover:bg-muted transition-colors ${
                    branch === b.name
                      ? "bg-muted text-primary font-semibold"
                      : "text-foreground"
                  }`}
                >
                  {b.label || b.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
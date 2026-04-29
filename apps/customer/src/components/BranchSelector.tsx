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
    <div style={{ backgroundColor: "#faf7f2" }} className="sticky top-14 z-30 border-b border-primary/20">
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
            <div style={{ backgroundColor: "#ffffff", borderColor: "#ebe6dd" }} className="absolute top-full left-0 mt-1 border rounded-lg shadow-2xl overflow-hidden z-50 min-w-[200px]">
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
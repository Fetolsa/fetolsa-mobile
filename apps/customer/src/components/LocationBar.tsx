import { useState } from "react";
import { MapPin, ChevronDown, Check } from "lucide-react";
import { useBranch } from "../context/BranchContext";
import { tenant } from "../tenant.generated";
import type { Branch } from "../types/menu";

interface Props {
  branches: Branch[];
}

export function LocationBar({ branches }: Props) {
  const [open, setOpen] = useState(false);
  const { branch, setBranch } = useBranch();

  if (branches.length === 0) return null;

  const branchAddresses = (tenant as { branchAddresses?: Record<string, string> }).branchAddresses ?? {};
  const subline = branch && branchAddresses[branch] ? branchAddresses[branch] : "Tap to change";

  return (
    <>
      <div style={{ backgroundColor: "#ffffff", borderColor: "#ebe6dd" }} className="border-b">
        <button
          onClick={() => setOpen(true)}
          className="w-full container max-w-md mx-auto flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-muted/30 transition-colors"
        >
          <div
            style={{ backgroundColor: "#fdecee", color: "#E60019" }}
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
          >
            <MapPin className="w-[18px] h-[18px]" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p
              style={{ color: "#888", letterSpacing: "0.08em" }}
              className="font-condensed text-[11px] uppercase leading-tight"
            >
              Deliver from
            </p>
            <p
              style={{ color: "#1a1a1a" }}
              className="font-condensed text-[14px] font-semibold leading-tight truncate"
            >
              {branch ? `${branch} - ${subline.split(",")[0]}` : "Select branch"}
            </p>
          </div>
          <ChevronDown style={{ color: "#1a1a1a" }} className="w-[18px] h-[18px] shrink-0" />
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
          onClick={() => setOpen(false)}
        >
          <div
            style={{ backgroundColor: "#ffffff" }}
            className="w-full max-w-md mx-auto rounded-t-2xl p-4 pb-6 max-h-[70vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
            <h3
              style={{ color: "#1a1a1a", letterSpacing: "0.06em" }}
              className="font-display text-xl uppercase mb-3"
            >
              Choose Branch
            </h3>
            <div className="space-y-1">
              {branches.map((b) => {
                const addr = branchAddresses[b.name];
                const selected = branch === b.name;
                return (
                  <button
                    key={b.name}
                    onClick={() => {
                      setBranch(b.name);
                      setOpen(false);
                    }}
                    style={{ backgroundColor: selected ? "#fdecee" : "transparent" }}
                    className="w-full text-left flex items-start gap-3 px-3 py-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <MapPin
                      style={{ color: selected ? "#E60019" : "#888" }}
                      className="w-5 h-5 mt-0.5 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        style={{ color: "#1a1a1a" }}
                        className="font-condensed font-semibold text-[15px] leading-tight"
                      >
                        {b.label || b.name}
                      </p>
                      {addr && (
                        <p className="text-xs text-muted-foreground mt-0.5">{addr}</p>
                      )}
                    </div>
                    {selected && (
                      <Check style={{ color: "#E60019" }} className="w-5 h-5 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import { createContext, useContext, useState, type ReactNode } from "react";

interface BranchContextValue {
  branch: string;
  setBranch: (b: string) => void;
}

const BranchContext = createContext<BranchContextValue | undefined>(undefined);

const STORAGE_KEY = "vc_branch";

export function BranchProvider({ children }: { children: ReactNode }) {
  const [branch, setBranchState] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || "";
    } catch {
      return "";
    }
  });

  const setBranch = (b: string) => {
    setBranchState(b);
    try {
      localStorage.setItem(STORAGE_KEY, b);
    } catch {
      // ignore storage failures (private mode, etc.)
    }
  };

  return (
    <BranchContext.Provider value={{ branch, setBranch }}>
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error("useBranch must be used within BranchProvider");
  return ctx;
}
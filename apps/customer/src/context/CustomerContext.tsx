import { createContext, useContext, useState, type ReactNode } from "react";

export interface CustomerInfo {
  name: string;
  phone: string;
  email?: string;
  address?: string;
}

interface CustomerContextValue {
  info: CustomerInfo;
  saveInfo: boolean;
  setSaveInfo: (v: boolean) => void;
  update: (patch: Partial<CustomerInfo>) => void;
  persist: (info: CustomerInfo) => void;
  clear: () => void;
}

const CustomerContext = createContext<CustomerContextValue | undefined>(undefined);

const STORAGE_KEY = "vc_customer_info";
const SAVE_PREF_KEY = "vc_customer_save";

const EMPTY_INFO: CustomerInfo = { name: "", phone: "", email: "", address: "" };

export function CustomerProvider({ children }: { children: ReactNode }) {
  const [info, setInfo] = useState<CustomerInfo>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...EMPTY_INFO, ...(JSON.parse(saved) as Partial<CustomerInfo>) } : EMPTY_INFO;
    } catch {
      return EMPTY_INFO;
    }
  });

  const [saveInfo, setSaveInfoState] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem(SAVE_PREF_KEY);
      return v === null ? true : v === "1";
    } catch {
      return true;
    }
  });

  const setSaveInfo = (v: boolean) => {
    setSaveInfoState(v);
    try {
      localStorage.setItem(SAVE_PREF_KEY, v ? "1" : "0");
    } catch {
      // ignore
    }
    if (!v) {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    }
  };

  const update = (patch: Partial<CustomerInfo>) => {
    setInfo((prev) => ({ ...prev, ...patch }));
  };

  const persist = (next: CustomerInfo) => {
    setInfo(next);
    if (saveInfo) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
    }
  };

  const clear = () => {
    setInfo(EMPTY_INFO);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  return (
    <CustomerContext.Provider value={{ info, saveInfo, setSaveInfo, update, persist, clear }}>
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer() {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error("useCustomer must be used within CustomerProvider");
  return ctx;
}
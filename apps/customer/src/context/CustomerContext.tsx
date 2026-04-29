import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  getCustomerProfile,
  updateEmail as apiUpdateEmail,
  type CustomerProfile,
  type CustomerOrder,
} from "../lib/auth-api";

// Guest checkout info (used when no token is present)
export interface CustomerInfo {
  name: string;
  phone: string;
  email?: string;
  address?: string;
}

interface CustomerContextValue {
  // Guest mode (for when not logged in)
  info: CustomerInfo;
  saveInfo: boolean;
  setSaveInfo: (v: boolean) => void;
  update: (patch: Partial<CustomerInfo>) => void;
  persist: (info: CustomerInfo) => void;

  // Logged-in mode
  customer: CustomerProfile | null;
  orders: CustomerOrder[];
  token: string | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (token: string, customer: CustomerProfile, orders?: CustomerOrder[]) => void;
  logout: () => void;
  updateEmail: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  needsEmailPrompt: boolean;
  setNeedsEmailPrompt: (v: boolean) => void;

  // Combined helper - merges logged-in profile or guest info
  effectiveInfo: CustomerInfo;
}

const CustomerContext = createContext<CustomerContextValue | undefined>(undefined);

const INFO_KEY = "vc_customer_info";
const SAVE_PREF_KEY = "vc_customer_save";
const TOKEN_KEY = "vc_customer_token";

const EMPTY_INFO: CustomerInfo = { name: "", phone: "", email: "", address: "" };

export function CustomerProvider({ children }: { children: ReactNode }) {
  // Guest state
  const [info, setInfo] = useState<CustomerInfo>(() => {
    try {
      const saved = localStorage.getItem(INFO_KEY);
      return saved
        ? { ...EMPTY_INFO, ...(JSON.parse(saved) as Partial<CustomerInfo>) }
        : EMPTY_INFO;
    } catch {
      return EMPTY_INFO;
    }
  });
  const [saveInfoFlag, setSaveInfoFlagState] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem(SAVE_PREF_KEY);
      return v === null ? true : v === "1";
    } catch {
      return true;
    }
  });

  // Logged-in state
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsEmailPrompt, setNeedsEmailPrompt] = useState(false);

  const setSaveInfo = (v: boolean) => {
    setSaveInfoFlagState(v);
    try {
      localStorage.setItem(SAVE_PREF_KEY, v ? "1" : "0");
    } catch {
      // ignore
    }
    if (!v) {
      try {
        localStorage.removeItem(INFO_KEY);
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
    if (saveInfoFlag) {
      try {
        localStorage.setItem(INFO_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
    }
  };

  const login = useCallback(
    (t: string, c: CustomerProfile, o?: CustomerOrder[]) => {
      setToken(t);
      setCustomer(c);
      setOrders(o || []);
      try {
        localStorage.setItem(TOKEN_KEY, t);
      } catch {
        // ignore
      }
      if (!c.email) setNeedsEmailPrompt(true);
    },
    [],
  );

  const logout = useCallback(() => {
    setToken(null);
    setCustomer(null);
    setOrders([]);
    setNeedsEmailPrompt(false);
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // ignore
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!token) return;
    const result = await getCustomerProfile(token);
    if (result?.customer) {
      setCustomer(result.customer);
      setOrders(result.orders || []);
    } else {
      logout();
    }
  }, [token, logout]);

  const updateEmail = useCallback(
    async (email: string) => {
      if (!token) return;
      await apiUpdateEmail(token, email);
      setCustomer((prev) => (prev ? { ...prev, email } : prev));
      setNeedsEmailPrompt(false);
    },
    [token],
  );

  // Boot: validate stored token
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const stored = (() => {
          try {
            return localStorage.getItem(TOKEN_KEY);
          } catch {
            return null;
          }
        })();
        if (!stored) {
          if (!cancelled) setIsLoading(false);
          return;
        }
        const result = await getCustomerProfile(stored);
        if (cancelled) return;
        if (result?.customer) {
          setToken(stored);
          setCustomer(result.customer);
          setOrders(result.orders || []);
        } else {
          try {
            localStorage.removeItem(TOKEN_KEY);
          } catch {
            // ignore
          }
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  // Effective info: prefer logged-in profile, fall back to guest info
  const effectiveInfo: CustomerInfo = customer
    ? {
        name: customer.name || "",
        phone: customer.phone || "",
        email: customer.email || "",
        address: customer.last_address || info.address || "",
      }
    : info;

  return (
    <CustomerContext.Provider
      value={{
        info,
        saveInfo: saveInfoFlag,
        setSaveInfo,
        update,
        persist,
        customer,
        orders,
        token,
        isLoggedIn: !!customer && !!token,
        isLoading,
        login,
        logout,
        updateEmail,
        refreshProfile,
        needsEmailPrompt,
        setNeedsEmailPrompt,
        effectiveInfo,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer() {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error("useCustomer must be used within CustomerProvider");
  return ctx;
}
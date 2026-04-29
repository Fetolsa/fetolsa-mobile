import { motion, AnimatePresence } from "framer-motion";
import { X, LogOut, Mail, MapPin, Loader2 } from "lucide-react";
import { useState } from "react";
import { useCustomer } from "../context/CustomerContext";
import type { CustomerOrder } from "../lib/auth-api";
import { OrderHistoryCard } from "./OrderHistoryCard";

interface Props {
  open: boolean;
  onClose: () => void;
  onReorder: (order: CustomerOrder) => void;
  onViewOrder: (orderId: string) => void;
}

export function AccountDrawer({ open, onClose, onReorder, onViewOrder }: Props) {
  const { customer, orders, logout, refreshProfile } = useCustomer();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshProfile();
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  const recentOrders = orders.slice(0, 10);
  const initial = (customer?.name || customer?.phone || "?").trim().charAt(0).toUpperCase();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            style={{ backgroundColor: "#ffffff" }}
            className="fixed left-0 top-0 bottom-0 z-50 w-full max-w-sm shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-primary/20">
              <h2 className="font-display text-xl tracking-wider text-primary">ACCOUNT</h2>
              <button
                onClick={onClose}
                className="p-1 hover:bg-muted rounded-lg transition-colors"
                aria-label="Close account"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Profile section */}
              <div className="p-4 border-b border-primary/10">
                <div className="flex items-center gap-3 mb-3">
                  <div style={{ backgroundColor: "#1a1a1a", color: "#ffffff" }} className="w-12 h-12 rounded-full flex items-center justify-center font-display text-xl tracking-wider">
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-condensed font-bold text-base uppercase tracking-wide text-foreground truncate">
                      {customer?.name || "No name"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {customer?.phone}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  {customer?.email ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground/70 italic">
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      <span>No email saved</span>
                    </div>
                  )}
                  {customer?.last_address && (
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{customer.last_address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Orders section */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg tracking-wider text-foreground">RECENT ORDERS</h3>
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="text-xs text-primary hover:underline disabled:opacity-50 flex items-center gap-1"
                  >
                    {refreshing && <Loader2 className="w-3 h-3 animate-spin" />}
                    Refresh
                  </button>
                </div>

                {recentOrders.length === 0 ? (
                  <p className="text-muted-foreground text-sm font-condensed text-center py-8">
                    No orders yet. Place your first order from the menu!
                  </p>
                ) : (
                  recentOrders.map((order) => (
                    <OrderHistoryCard
                      key={order.name}
                      order={order}
                      onReorder={(o) => {
                        onReorder(o);
                        onClose();
                      }}
                      onView={(id) => {
                        onViewOrder(id);
                        onClose();
                      }}
                    />
                  ))
                )}
              </div>
            </div>

            <div className="border-t border-primary/20 p-4">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 bg-muted text-muted-foreground hover:text-destructive hover:bg-destructive/10 font-condensed font-bold uppercase tracking-wider py-3 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
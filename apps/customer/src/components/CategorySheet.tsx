import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { MenuCategory } from "../types/menu";

interface Props {
  open: boolean;
  categories: MenuCategory[];
  active: string;
  onClose: () => void;
  onSelect: (name: string) => void;
}

export function CategorySheet({ open, categories, active, onClose, onSelect }: Props) {
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
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            style={{ backgroundColor: "#ffffff" }}
            className="fixed left-0 right-0 bottom-0 z-50 rounded-t-2xl shadow-2xl flex flex-col max-h-[80vh]"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div
                style={{ backgroundColor: "#d8d2c5" }}
                className="w-10 h-1 rounded-full"
              />
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-b border-primary/10">
              <h2
                style={{ color: "#1a1a1a" }}
                className="font-display text-xl tracking-wider"
              >
                BROWSE CATEGORIES
              </h2>
              <button
                onClick={onClose}
                className="p-1 hover:bg-muted rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-2 gap-2">
                {categories.map((cat) => {
                  const isActive = active === cat.name;
                  return (
                    <button
                      key={cat.name}
                      onClick={() => {
                        onSelect(cat.name);
                        onClose();
                      }}
                      style={{
                        backgroundColor: isActive ? "#1a1a1a" : "#faf7f2",
                        borderColor: isActive ? "#1a1a1a" : "#ebe6dd",
                        color: isActive ? "#ffffff" : "#1a1a1a",
                      }}
                      className="p-3 rounded-lg border text-left transition-colors"
                    >
                      <p className="font-condensed font-bold text-sm uppercase tracking-wide leading-tight">
                        {cat.name}
                      </p>
                      <p
                        className="text-xs mt-0.5 opacity-70"
                      >
                        {cat.items.length} item{cat.items.length === 1 ? "" : "s"}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
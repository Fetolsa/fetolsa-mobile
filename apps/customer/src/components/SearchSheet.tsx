import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search } from "lucide-react";
import type { MenuCategory, MenuItem } from "../types/menu";
import { searchMenu, type SearchResult } from "../lib/search";
import { placeholderColor, placeholderInitial, resolveImageUrl } from "../lib/placeholder";
import { tenant } from "../tenant.generated";

interface Props {
  open: boolean;
  categories: MenuCategory[];
  onClose: () => void;
  onSelectItem: (item: MenuItem) => void;
  onSelectCategory: (name: string) => void;
}

export function SearchSheet({
  open,
  categories,
  onClose,
  onSelectItem,
  onSelectCategory,
}: Props) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when sheet opens; reset query on close
  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    const t = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, [open]);

  const results = useMemo<SearchResult[]>(() => {
    return searchMenu(categories, query);
  }, [categories, query]);

  const handleResultClick = (result: SearchResult) => {
    if (result.type === "item" && result.item) {
      onSelectItem(result.item);
    } else if (result.type === "category" && result.category) {
      onSelectCategory(result.category);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ backgroundColor: "#faf7f2" }}
          className="fixed inset-0 z-50 flex flex-col"
        >
          {/* Search input bar */}
          <div
            style={{ backgroundColor: "#ffffff", borderColor: "#ebe6dd" }}
            className="border-b shadow-sm"
          >
            <div className="container max-w-md mx-auto flex items-center gap-3 h-14 px-4">
              <Search className="w-5 h-5 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                type="search"
                inputMode="search"
                enterKeyHint="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search menu..."
                style={{ color: "#1a1a1a" }}
                className="flex-1 bg-transparent text-base focus:outline-none placeholder:text-muted-foreground"
              />
              <button
                onClick={onClose}
                className="p-1 hover:bg-muted rounded-lg transition-colors shrink-0"
                aria-label="Close search"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Results body */}
          <div className="flex-1 overflow-y-auto">
            <div className="container max-w-md mx-auto px-4 py-3 space-y-2">
              {!query.trim() && (
                <div className="text-center py-20">
                  <Search className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                  <p
                    style={{ color: "#1a1a1a" }}
                    className="font-condensed font-bold uppercase tracking-wide text-sm"
                  >
                    Start typing to search
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {categories.reduce((s, c) => s + c.items.length, 0)} items across{" "}
                    {categories.length} categories
                  </p>
                </div>
              )}

              {query.trim() && results.length === 0 && (
                <div className="text-center py-20">
                  <p
                    style={{ color: "#1a1a1a" }}
                    className="font-condensed font-bold uppercase tracking-wide text-sm"
                  >
                    No results
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Try a different search term
                  </p>
                </div>
              )}

              {results.map((result, idx) => {
                if (result.type === "category" && result.category) {
                  return (
                    <button
                      key={`cat-${result.category}-${idx}`}
                      onClick={() => handleResultClick(result)}
                      style={{ backgroundColor: "#1a1a1a", color: "#ffffff" }}
                      className="w-full text-left rounded-xl p-3 flex items-center justify-between hover:opacity-90 transition-opacity"
                    >
                      <div>
                        <p className="font-condensed font-bold text-sm uppercase tracking-wide">
                          Browse: {result.category}
                        </p>
                        <p className="text-xs opacity-70 mt-0.5">
                          Jump to category
                        </p>
                      </div>
                      <span className="text-xs font-condensed uppercase opacity-70">
                        Category
                      </span>
                    </button>
                  );
                }

                if (result.type === "item" && result.item) {
                  const item = result.item;
                  const imageUrl = resolveImageUrl(item.image, tenant.apiBaseUrl);
                  const initial = placeholderInitial(item.item_name);
                  const placeholderBg = placeholderColor(item.item_name);

                  return (
                    <button
                      key={`item-${item.item_code}-${idx}`}
                      onClick={() => handleResultClick(result)}
                      style={{ backgroundColor: "#ffffff", borderColor: "#ebe6dd" }}
                      className="w-full text-left rounded-xl border p-3 flex items-center gap-3 hover:shadow-sm transition-shadow"
                    >
                      <div
                        style={{
                          backgroundColor: imageUrl ? undefined : placeholderBg,
                        }}
                        className="w-12 h-12 rounded-lg shrink-0 overflow-hidden flex items-center justify-center"
                      >
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={item.item_name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <span
                            style={{ color: "#1a1a1a" }}
                            className="font-display text-lg tracking-wider"
                          >
                            {initial}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          style={{ color: "#1a1a1a" }}
                          className="font-condensed font-bold text-sm uppercase tracking-wide truncate"
                        >
                          {item.item_name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {item.category}
                        </p>
                      </div>
                      <p
                        style={{ color: "#1a1a1a" }}
                        className="font-condensed font-bold text-sm shrink-0"
                      >
                        &#8358;{item.rate.toLocaleString()}
                      </p>
                    </button>
                  );
                }

                return null;
              })}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
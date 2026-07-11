"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";

export interface SimpleSelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface SimpleSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SimpleSelectOption[];
  placeholder?: string;
  className?: string;
}

/**
 * A simple dropdown select that works inside `position: fixed` containers
 * (e.g., modal dashboards) — uses inline rendering instead of Radix Portal,
 * so it doesn't break when the parent is fixed/transformed.
 */
export function SimpleSelect({
  value,
  onValueChange,
  options,
  placeholder = "Select...",
  className = "",
}: SimpleSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const selected = options.find((o) => o.value === value);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    // Use setTimeout to avoid the click that opened it from immediately closing
    const t = setTimeout(() => {
      document.addEventListener("mousedown", handler);
    }, 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", handler);
    };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-left text-sm shadow-sm transition-colors hover:bg-accent/40 focus:outline-none focus:ring-2 focus:ring-ring"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={selected ? "text-foreground truncate" : "text-muted-foreground"}>
          {selected ? (
            <span className="flex items-center gap-2">
              <span className="truncate">{selected.label}</span>
              {selected.sublabel && (
                <span className="text-[10px] text-muted-foreground shrink-0">{selected.sublabel}</span>
              )}
            </span>
          ) : (
            placeholder
          )}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-[200] mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-border bg-popover shadow-lg thin-scroll"
            style={{ position: "absolute" }}
            role="listbox"
          >
            {options.length === 0 ? (
              <div className="px-3 py-2 text-xs text-muted-foreground">No options</div>
            ) : (
              options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onValueChange(opt.value);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors ${
                      isSelected
                        ? "bg-emerald-700/10 text-foreground"
                        : "text-foreground hover:bg-accent/40"
                    }`}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="truncate">{opt.label}</span>
                      {opt.sublabel && (
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {opt.sublabel}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 shrink-0 text-emerald-700 dark:text-[var(--gold)]" />
                    )}
                  </button>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

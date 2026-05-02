"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { ReactNode, useEffect } from "react";
import { cn } from "@/lib/utils";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] grid place-items-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 360, damping: 28 }}
            className={cn(
              "relative glass-strong w-full p-6",
              size === "sm" && "max-w-sm",
              size === "md" && "max-w-md",
              size === "lg" && "max-w-lg",
            )}
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-9 h-9 grid place-items-center rounded-lg hover:bg-white/[0.05]"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-lg font-semibold pr-8">{title}</h3>
            {description && <p className="text-[13px] text-white/55 mt-1 mb-4">{description}</p>}
            {!description && <div className="h-3" />}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

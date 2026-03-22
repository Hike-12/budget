"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiCheckCircle, FiXCircle } from "react-icons/fi";

let memoryToasts = [];
let listeners = [];

function notifyListeners() {
  listeners.forEach((listener) => listener([...memoryToasts]));
}

const addToast = (message, type) => {
  const id = Date.now().toString(36) + Math.random().toString(36);
  memoryToasts = [...memoryToasts, { id, message, type }];
  notifyListeners();

  setTimeout(() => {
    memoryToasts = memoryToasts.filter((t) => t.id !== id);
    notifyListeners();
  }, 4000);
};

export const toast = {
  success: (message) => addToast(message, "success"),
  error: (message) => addToast(message, "error"),
  info: (message) => addToast(message, "info"),
};

export function Toaster({ position = "top-right" }) {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    listeners.push(setToasts);
    return () => {
      listeners = listeners.filter((l) => l !== setToasts);
    };
  }, []);

  const posClasses = {
    "top-right": "top-4 right-4 items-end",
    "top-left": "top-4 left-4 items-start",
    "bottom-right": "bottom-4 right-4 items-end",
    "bottom-left": "bottom-4 left-4 items-start",
  };

  return (
    <div className={`fixed z-[9999] flex flex-col gap-2 pointer-events-none ${posClasses[position]}`}>
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 min-w-[300px] max-w-sm rounded-xl shadow-2xl border backdrop-blur-md transition-all ${
              t.type === "success"
                ? "bg-[#0a0a0a]/90 border-emerald-500/20 shadow-emerald-500/10"
                : t.type === "error"
                ? "bg-[#0a0a0a]/90 border-red-500/20 shadow-red-500/10"
                : "bg-[#0a0a0a]/90 border-white/10"
            }`}
          >
            {t.type === "success" && <FiCheckCircle className="text-emerald-400 text-lg flex-shrink-0" />}
            {t.type === "error" && <FiXCircle className="text-red-400 text-lg flex-shrink-0" />}
            {t.type === "info" && <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />}
            <span className="text-sm font-medium text-accent">{t.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

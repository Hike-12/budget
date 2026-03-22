"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiChevronDown, FiCheck } from "react-icons/fi";

export default function CustomSelect({ value, onChange, options, placeholder = "Select...", className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-[#0e0e0e] border border-white/8 rounded-lg px-4 py-2.5 text-accent text-sm focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all duration-200"
      >
        <span className={selectedOption ? "text-accent" : "text-secondary/25"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <FiChevronDown className="text-secondary/40" />
        </motion.span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute z-[999] w-full mt-1.5 p-1 bg-[#0a0a0a] border border-white/10 rounded-lg shadow-2xl overflow-hidden"
            role="listbox"
          >
            <div className="max-h-60 overflow-y-auto thin-scrollbar">
              {options.map((opt) => {
                const isSelected = value === opt.value;
                return (
                  <button
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    type="button"
                    onClick={() => { onChange(opt.value); setIsOpen(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors duration-150 ${
                      isSelected
                        ? "bg-white/10 text-accent font-medium"
                        : "text-secondary/60 hover:bg-white/5 hover:text-accent"
                    }`}
                  >
                    {opt.label}
                    {isSelected && <FiCheck className="text-primary text-sm" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

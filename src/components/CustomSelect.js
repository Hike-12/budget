"use client";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { FiChevronDown, FiCheck } from "react-icons/fi";
import { popupOpensUp } from "./popupSide";

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select...",
  className = "",
  buttonClassName = "",
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => o.value === value);

  return (
    <div
      className={`relative ${isOpen ? "z-20" : ""} ${className}`}
      ref={containerRef}
      onKeyDown={(event) => {
        if (!isOpen) return;
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          setIsOpen(false);
          triggerRef.current?.focus();
        }
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          const items = [
            ...containerRef.current.querySelectorAll(
              '[role="option"]:not(:disabled)',
            ),
          ];
          if (!items.length) return;
          event.preventDefault();
          const index = items.indexOf(document.activeElement);
          items[
            (index +
              (event.key === "ArrowDown" ? 1 : index < 0 ? 0 : -1) +
              items.length) %
              items.length
          ].focus();
        }
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        onClick={(event) => {
          if (!isOpen)
            setOpenUp(
              popupOpensUp(
                event.currentTarget,
                Math.min(252, options.length * 39 + 14),
              ),
            );
          setIsOpen(!isOpen);
        }}
        className={`w-full min-w-0 flex items-center justify-between gap-2 bg-[#0e0e0e] border border-white/8 rounded-lg px-4 h-10 text-[var(--color-accent)] text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] transition-colors ${buttonClassName}`}
      >
        <span
          className={`min-w-0 truncate text-left ${selectedOption ? "text-[var(--color-accent)]" : "text-white/35"}`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <FiChevronDown className="text-secondary/40" />
        </motion.span>
      </button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className={`absolute z-[999] w-full p-1.5 bg-[#0a0a0a] border border-white/10 rounded-lg shadow-xl overflow-hidden ${openUp ? "bottom-full mb-2" : "top-full mt-2"}`}
          role="listbox"
        >
          <div className="max-h-60 overflow-y-auto thin-scrollbar p-0.5 space-y-1">
            {options.map((opt) => {
              const isSelected = value === opt.value;
              return (
                <button
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  disabled={opt.disabled}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    triggerRef.current?.focus();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-md transition-colors duration-150 focus:outline-none focus-visible:bg-white/10 ${
                    isSelected
                      ? "bg-white/10 text-accent font-semibold"
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
    </div>
  );
}

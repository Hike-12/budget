"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiCalendar, FiChevronLeft, FiChevronRight } from "react-icons/fi";

const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function CustomDatePicker({ value, onChange, className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // value is expected as "YYYY-MM-DD"
  const selectedDate = value ? new Date(value) : new Date();
  
  const [viewDate, setViewDate] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };
  const handleNextMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const currentMonthName = viewDate.toLocaleString("default", { month: "long" });
  const currentYear = viewDate.getFullYear();

  // Generate calendar grid
  const startDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const blanks = Array.from({ length: startDay }, (_, i) => null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const displayDateStr = value
    ? new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "Select date";

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-10 flex items-center gap-2 bg-[#0e0e0e] border border-white/8 rounded-lg px-4 text-accent text-sm focus:outline-none focus:border-primary/40 transition-all duration-200"
      >
        <FiCalendar className="text-secondary/40 text-[13px]" aria-hidden="true" />
        <span className={value ? "text-accent" : "text-secondary/30"}>{displayDateStr}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute z-[999] right-0 mt-2 p-4 bg-[#0a0a0a]/90 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_20px_40px_-12px_rgba(0,0,0,1),inset_0_1px_1px_rgba(255,255,255,0.05)] w-[280px]"
            role="dialog"
            aria-label="Calendar component"
            // Prevent close on internal clicks
            onClick={(e) => e.stopPropagation()}
          >
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white/5 text-secondary/50 hover:text-accent transition-colors"
              >
                <FiChevronLeft className="text-sm" />
              </button>
              <span className="text-accent text-sm font-semibold tracking-tight">
                {currentMonthName} {currentYear}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white/5 text-secondary/50 hover:text-accent transition-colors"
              >
                <FiChevronRight className="text-sm" />
              </button>
            </div>

            {/* Days row */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {daysOfWeek.map(d => (
                <div key={d} className="text-center text-[10px] font-semibold tracking-wider uppercase text-secondary/40">
                  {d}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 gap-1">
              {blanks.map((_, i) => <div key={`blank-${i}`} />)}
              {days.map(d => {
                const dateObj = new Date(viewDate.getFullYear(), viewDate.getMonth(), d);
                // format native input value
                const dateStr = [
                  dateObj.getFullYear(),
                  String(dateObj.getMonth() + 1).padStart(2, '0'),
                  String(dateObj.getDate()).padStart(2, '0')
                ].join('-');

                const isSelected = value === dateStr;
                const isToday = new Date().toDateString() === dateObj.toDateString();

                return (
                  <button
                    key={d}
                    type="button"
                    aria-label={`${d} ${currentMonthName} ${currentYear}`}
                    aria-pressed={isSelected}
                    onClick={() => { onChange(dateStr); setIsOpen(false); }}
                    className={`w-7 h-7 flex items-center justify-center rounded-md text-xs transition-all duration-150 ${
                      isSelected
                        ? "bg-primary text-dark font-bold shadow-md shadow-primary/20"
                        : isToday
                          ? "bg-white/5 text-accent font-semibold border border-white/10"
                          : "text-secondary/70 hover:bg-white/10 hover:text-accent"
                    }`}
                  >
                    {d}
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

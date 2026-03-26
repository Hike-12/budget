"use client";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { FiChevronLeft, FiChevronRight, FiInbox, FiCalendar } from "react-icons/fi";

async function fetchBudgetsApi(username) {
  const res = await fetch(`/api/budgets?user=${username}`);
  if (!res.ok) throw new Error("Failed to fetch budgets");
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export default function CalendarPage() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [username, setUsername] = useState("");
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    return today;
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("username") || "";
    if (!storedUser) {
      router.replace("/login");
      return;
    }
    setUsername(storedUser);
    setIsReady(true);
  }, [router]);

  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ["budgets", username],
    queryFn: () => fetchBudgetsApi(username),
    enabled: !!username,
  });

  // Calculate days for the calendar grid
  const { daysInMonth, startDay, monthName, year, currentMonthIndex } = useMemo(() => {
    const year = currentDate.getFullYear();
    const currentMonthIndex = currentDate.getMonth();
    const daysInMonth = new Date(year, currentMonthIndex + 1, 0).getDate();
    const startDay = new Date(year, currentMonthIndex, 1).getDay();
    const monthName = currentDate.toLocaleString("default", { month: "long" });
    return { daysInMonth, startDay, monthName, year, currentMonthIndex };
  }, [currentDate]);

  // Map budgets to discrete dates
  const budgetMap = useMemo(() => {
    const map = new Map();
    budgets.forEach((b) => {
      const d = new Date(b.createdAt);
      d.setHours(0,0,0,0);
      const time = d.getTime();
      if (!map.has(time)) {
        map.set(time, { income: 0, expense: 0, items: [] });
      }
      const dayData = map.get(time);
      if (b.type === "income") dayData.income += Number(b.amount);
      else dayData.expense += Number(b.amount);
      dayData.items.push(b);
    });
    return map;
  }, [budgets]);

  const prevMonth = () => setCurrentDate(new Date(year, currentMonthIndex - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, currentMonthIndex + 1, 1));
  const goToday = () => {
    const today = new Date();
    setCurrentDate(today);
    today.setHours(0,0,0,0);
    setSelectedDate(today);
  };

  const selectedDayData = useMemo(() => {
    if (!selectedDate) return null;
    return budgetMap.get(selectedDate.getTime()) || { income: 0, expense: 0, items: [] };
  }, [selectedDate, budgetMap]);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-28 pb-16">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="mb-8"
      >
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/4 border border-white/8 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span className="text-primary/80 text-[10px] font-semibold uppercase tracking-[0.15em]">Chronology</span>
        </div>
        <h1 className="font-grotesk text-3xl font-semibold text-accent tracking-tight">
          Transaction Calendar
        </h1>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
        {/* Calendar Widget */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, type: "spring", stiffness: 120, damping: 20 }}
          className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
            <h2 className="text-2xl font-grotesk font-semibold text-accent tracking-tight">
              {monthName} <span className="text-secondary/50">{year}</span>
            </h2>
            <div className="flex items-center gap-3">
              <button 
                onClick={goToday}
                className="px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-all duration-200 active:scale-95"
              >
                Today
              </button>
              <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-1">
                <button 
                  onClick={prevMonth}
                  className="p-2 rounded-md hover:bg-white/10 text-secondary/70 hover:text-accent transition-colors active:scale-90"
                  aria-label="Previous month"
                >
                  <FiChevronLeft size={18} />
                </button>
                <div className="w-px h-4 bg-white/10 mx-1" />
                <button 
                  onClick={nextMonth}
                  className="p-2 rounded-md hover:bg-white/10 text-secondary/70 hover:text-accent transition-colors active:scale-90"
                  aria-label="Next month"
                >
                  <FiChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Grid setup */}
          <div className="p-6">
            <div className="grid grid-cols-7 gap-1 mb-4">
              {WEEKDAYS.map(day => (
                <div key={day} className="text-center text-[11px] font-bold text-secondary/40 uppercase tracking-widest pb-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {/* Empty days from start of month */}
              {Array.from({ length: startDay }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square rounded-xl bg-transparent pointer-events-none" />
              ))}
              
              {/* Days of month */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayStr = i + 1;
                const d = new Date(year, currentMonthIndex, dayStr);
                d.setHours(0,0,0,0);
                const time = d.getTime();

                const today = new Date();
                today.setHours(0,0,0,0);
                const isToday = time === today.getTime();
                
                const isSelected = selectedDate?.getTime() === time;

                const dayData = budgetMap.get(time);
                const hasIncome = dayData && dayData.income > 0;
                const hasExpense = dayData && dayData.expense > 0;

                return (
                  <motion.button
                    key={dayStr}
                    onClick={() => setSelectedDate(d)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative aspect-square flex flex-col items-center pt-3 rounded-2xl border transition-all duration-200 group overflow-hidden ${
                      isSelected 
                        ? "border-primary/50 bg-primary/10 shadow-[0_0_20px_rgba(86,130,177,0.15)]" 
                        : isToday 
                          ? "border-white/20 bg-white/8 hover:bg-white/15 hover:border-white/30" 
                          : "border-transparent bg-white/4 hover:bg-white/10"
                    }`}
                  >
                    <span className={`text-base font-semibold z-10 ${isSelected ? "text-primary" : isToday ? "text-accent font-bold" : "text-accent/80 group-hover:text-accent"}`}>
                      {dayStr}
                    </span>

                    {/* Indicators inline for a cleaner look */}
                    <div className="absolute bottom-2 flex flex-col items-center gap-0.5 z-10 w-full px-1">
                       {dayData && (hasIncome || hasExpense) ? (
                         <div className="flex gap-1">
                           {hasIncome && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />}
                           {hasExpense && <span className="w-1.5 h-1.5 rounded-full bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.8)]" />}
                         </div>
                       ) : null}
                    </div>

                    {/* Background glow when selected */}
                    {isSelected && (
                      <motion.div 
                        layoutId="calendar-selection"
                        className="absolute inset-0 bg-primary/5 z-0"
                        transition={{ duration: 0.3 }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Selected Day View */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={selectedDate?.getTime() || "empty"}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-4"
          >
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-md sticky top-24">
              <h3 className="font-grotesk font-semibold text-accent text-xl mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <FiCalendar size={18} />
                </div>
                {selectedDate ? selectedDate.toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric" }) : "Select a Date"}
              </h3>

              {isLoading ? (
                <div className="py-12 flex justify-center">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : selectedDayData && selectedDayData.items.length > 0 ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gradient-to-br from-emerald-400/10 to-transparent border border-emerald-400/20 p-4 rounded-xl">
                      <p className="text-[10px] items-center uppercase tracking-widest font-semibold text-emerald-400/60 mb-2 whitespace-nowrap">Total Income</p>
                      <p className="font-grotesk font-bold text-emerald-400 text-xl tabular-nums break-all leading-none py-1">
                        +₹{selectedDayData.income.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-red-400/10 to-transparent border border-red-400/20 p-4 rounded-xl">
                      <p className="text-[10px] items-center uppercase tracking-widest font-semibold text-red-400/60 mb-2 whitespace-nowrap">Total Expense</p>
                      <p className="font-grotesk font-bold text-red-400 text-xl tabular-nums break-all leading-none py-1">
                        -₹{selectedDayData.expense.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <p className="text-[10px] text-secondary/50 uppercase tracking-widest font-bold border-b border-white/10 pb-2">Transactions</p>
                    <div className="max-h-[360px] overflow-y-auto thin-scrollbar pr-1 space-y-2">
                      {selectedDayData.items.map((item, idx) => (
                        <motion.div 
                          key={item._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 + 0.1 }}
                          className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 transition-colors group cursor-pointer"
                        >
                          <div className="flex items-center gap-3 min-w-0 pr-3">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 font-bold ${
                              item.type === "income" ? "bg-emerald-400/10 text-emerald-400" : "bg-red-400/10 text-red-400"
                            }`}>
                              {item.type === "income" ? "+" : "-"}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-accent/90 group-hover:text-accent truncate transition-colors">{item.title}</p>
                              <p className="text-[11px] font-medium text-secondary/50 capitalize truncate mt-0.5 tracking-wide">
                                {item.category}
                                {item.note && <span className="lowercase"> • {item.note}</span>}
                              </p>
                            </div>
                          </div>
                          <div className={`text-sm font-bold tabular-nums whitespace-nowrap flex-shrink-0 ${
                            item.type === "income" ? "text-emerald-400" : "text-red-400"
                          }`}>
                            ₹{Number(item.amount).toLocaleString("en-IN")}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 px-4 border border-dashed border-white/10 rounded-2xl bg-white/5">
                  <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiInbox className="text-secondary/30" size={20} />
                  </div>
                  <p className="text-sm font-medium text-accent">No transactions</p>
                  <p className="text-xs text-secondary/50 mt-1 max-w-[200px] mx-auto">There are no transactions recorded for this specific date.</p>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}

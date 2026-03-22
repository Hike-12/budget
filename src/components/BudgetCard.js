"use client";
import { motion } from "framer-motion";
import { FiCalendar, FiTrash2, FiEdit2, FiArrowUpRight, FiArrowDownRight } from "react-icons/fi";

export default function BudgetCard({ budget, onDelete, onEdit, index = 0 }) {
  const isIncome = budget.type === "income";
  const accentColor = isIncome ? "#34d399" : "#f87171";
  const accentBg    = isIncome ? "rgba(52,211,153,0.08)"  : "rgba(248,113,113,0.08)";
  const accentBorder= isIncome ? "rgba(52,211,153,0.18)"  : "rgba(248,113,113,0.18)";

  const dateStr = new Date(budget.createdAt).toLocaleDateString("en-IN", {
    month: "short", day: "numeric", year: "numeric",
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 350, damping: 26, delay: index * 0.025 }}
      whileHover={{ y: -4, scale: 1.015, boxShadow: `0 12px 24px -10px ${accentBorder}` }}
      whileTap={{ scale: 0.98, y: 0 }}
      className="group relative h-full will-change-transform"
    >
      <div
        className="relative bg-[#0a0a0a] border rounded-xl p-4 flex flex-col h-full transition-all duration-200"
        style={{ borderColor: accentBorder }}
      >
        {/* Left accent bar */}
        <div
          className="absolute top-3 bottom-3 left-0 w-[3px] rounded-r-full"
          style={{ background: accentColor, opacity: 0.6 }}
        />

        {/* Top row: title + amount */}
        <div className="pl-3 flex items-start justify-between gap-3">
          <span className="font-grotesk font-semibold text-accent text-sm leading-snug tracking-tight">
            {budget.title}
          </span>
          <span
            className="font-grotesk text-base font-bold tabular-nums flex-shrink-0"
            style={{ color: accentColor }}
          >
            {isIncome ? "+" : "−"}₹{Number(budget.amount).toLocaleString("en-IN")}
          </span>
        </div>

        {/* Tags row */}
        <div className="pl-3 flex items-center gap-2 flex-wrap mt-2">
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider"
            style={{ background: accentBg, color: accentColor }}
          >
            {isIncome
              ? <FiArrowUpRight strokeWidth={2.5} className="text-[9px]" />
              : <FiArrowDownRight strokeWidth={2.5} className="text-[9px]" />
            }
            {budget.type}
          </span>
          <span
            className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wider"
            style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,232,219,0.5)" }}
          >
            {budget.category}
          </span>
        </div>

        {/* Note — always rendered to keep layout consistent; flex-1 fills space */}
        <div className="pl-3 flex-1 mt-2">
          {budget.note && (
            <p className="text-xs text-secondary/45 italic leading-relaxed">
              {budget.note}
            </p>
          )}
        </div>

        {/* Bottom row: date + actions — pinned to bottom */}
        <div className="pl-3 flex items-center justify-between pt-2 border-t border-white/[0.05] mt-auto">
          <span className="text-[11px] text-secondary/40 flex items-center gap-1.5 font-medium">
            <FiCalendar strokeWidth={1.5} className="text-[10px]" />
            {dateStr}
          </span>
          <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 translate-x-0 sm:translate-x-2 sm:group-hover:translate-x-0 transition-all duration-200">
            <button
              onClick={() => onEdit(budget)}
              className="w-7 h-7 rounded-lg bg-white/4 flex items-center justify-center text-secondary/50 hover:text-primary hover:bg-primary/10 transition-all duration-150 active:scale-95"
              title="Edit"
              aria-label="Edit transaction"
            >
              <FiEdit2 strokeWidth={1.5} className="text-[11px]" />
            </button>
            <button
              onClick={onDelete}
              className="w-7 h-7 rounded-lg bg-white/4 flex items-center justify-center text-secondary/50 hover:text-red-400 hover:bg-red-500/8 transition-all duration-150 active:scale-95"
              title="Delete"
              aria-label="Delete transaction"
            >
              <FiTrash2 strokeWidth={1.5} className="text-[11px]" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
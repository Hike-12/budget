"use client";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { FiTrendingUp, FiTrendingDown, FiActivity } from "react-icons/fi";

export default function TotalBalance({ budgets }) {
  const { income, expense, total, savingsRate } = useMemo(() => {
    let incomeTotal = 0;
    let expenseTotal = 0;

    for (const budget of budgets) {
      if (budget.type === "income") incomeTotal += Number(budget.amount) || 0;
      else expenseTotal += Number(budget.amount) || 0;
    }

    const netTotal = incomeTotal - expenseTotal;
    const rate =
      incomeTotal > 0 ? Math.round((netTotal / incomeTotal) * 100) : null;

    return {
      income: incomeTotal,
      expense: expenseTotal,
      total: netTotal,
      savingsRate: rate,
    };
  }, [budgets]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="mb-8 bg-[#0a0a0a] border border-white/8 rounded-xl p-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Main balance */}
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-white/4 border border-white/8 flex items-center justify-center flex-shrink-0">
            <FiActivity className="text-primary text-lg" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-secondary/50 text-[10px] font-semibold uppercase tracking-[0.15em] mb-1">
              Net Balance
            </p>
            <div
              className="font-grotesk font-semibold tabular-nums leading-none"
              style={{
                fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                color: total >= 0 ? "var(--color-accent)" : "#f87171",
              }}
            >
              {total < 0 ? "-" : ""}₹{Math.abs(total).toLocaleString("en-IN")}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-stretch gap-2 lg:items-center w-full lg:w-auto overflow-x-auto thin-scrollbar pb-2 lg:pb-0 -mb-2 lg:mb-0">
          <div className="hidden lg:block w-px h-10 bg-white/6 mr-2" />

          {/* Income */}
          <div className="flex items-center flex-shrink-0 min-w-[130px] gap-3 bg-white/3 border border-white/6 rounded-lg px-4 py-3">
            <FiTrendingUp
              className="text-emerald-400 text-sm flex-shrink-0"
              strokeWidth={1.5}
            />
            <div>
              <p className="text-secondary/40 text-[10px] font-semibold uppercase tracking-widest mb-0.5">
                Income
              </p>
              <p className="font-grotesk text-emerald-400 font-semibold text-sm tabular-nums">
                ₹{income.toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          {/* Expense */}
          <div className="flex items-center flex-shrink-0 min-w-[130px] gap-3 bg-white/3 border border-white/6 rounded-lg px-4 py-3">
            <FiTrendingDown
              className="text-red-400 text-sm flex-shrink-0"
              strokeWidth={1.5}
            />
            <div>
              <p className="text-secondary/40 text-[10px] font-semibold uppercase tracking-widest mb-0.5">
                Expenses
              </p>
              <p className="font-grotesk text-red-400 font-semibold text-sm tabular-nums">
                ₹{expense.toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          {/* Savings rate */}
          {savingsRate !== null && (
            <div className="flex items-center flex-shrink-0 min-w-[100px] gap-3 bg-white/3 border border-white/6 rounded-lg px-4 py-3">
              <div>
                <p className="text-secondary/40 text-[10px] font-semibold uppercase tracking-widest mb-0.5">
                  Saved
                </p>
                <p
                  className="font-grotesk font-semibold text-sm tabular-nums"
                  style={{
                    color:
                      savingsRate >= 0 ? "var(--color-primary)" : "#f87171",
                  }}
                >
                  {savingsRate}%
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

import { FaWallet, FaArrowUp, FaArrowDown } from "react-icons/fa";
import { motion } from "framer-motion";

export default function TotalBalance({ budgets }) {
  const income = budgets.filter(b => b.type === "income").reduce((acc, b) => acc + b.amount, 0);
  const expense = budgets.filter(b => b.type === "expense").reduce((acc, b) => acc + b.amount, 0);
  const total = income - expense;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="relative overflow-hidden bg-dark border border-secondary/20 rounded-3xl p-8 mb-10 shadow-2xl backdrop-blur-xl"
    >
      <div className="absolute top-[-50%] right-[-10%] w-[60%] h-[150%] bg-primary/10 blur-[80px] rounded-full pointer-events-none" />
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-secondary/10 border border-primary/20 flex items-center justify-center shadow-inner">
            <FaWallet className="text-primary text-3xl drop-shadow-md" />
          </div>
          <div>
            <div className="text-secondary text-sm font-medium uppercase tracking-wider mb-1">Total Balance</div>
            <div className={`font-grotesk text-4xl md:text-5xl font-bold tracking-tight ${total >= 0 ? "text-accent" : "text-red-400"}`}>
              ₹{total.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="flex gap-4 md:gap-8 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-secondary/20">
          <div className="flex-1 md:flex-none">
            <div className="flex items-center gap-2 text-secondary text-xs font-medium uppercase tracking-wider mb-1">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <FaArrowUp className="text-emerald-400 text-[10px]" />
              </span>
              Income
            </div>
            <div className="font-grotesk text-xl font-semibold text-emerald-400">
              ₹{income.toLocaleString()}
            </div>
          </div>
          <div className="w-px h-12 bg-secondary/20 hidden md:block" />
          <div className="flex-1 md:flex-none">
            <div className="flex items-center gap-2 text-secondary text-xs font-medium uppercase tracking-wider mb-1">
              <span className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center">
                <FaArrowDown className="text-red-400 text-[10px]" />
              </span>
              Expense
            </div>
            <div className="font-grotesk text-xl font-semibold text-red-400">
              ₹{expense.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
import { motion } from "framer-motion";
import { FaRegCalendarAlt, FaTrash, FaEdit } from "react-icons/fa";

export default function BudgetCard({ budget, onDelete, onEdit }) {
  const isIncome = budget.type === "income";
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={`relative group bg-dark/50 backdrop-blur-md border border-secondary/10 hover:border-${isIncome ? 'primary' : 'red-500'}/50 rounded-2xl p-5 shadow-lg flex flex-col gap-3 transition-all duration-300 overflow-hidden`}
      tabIndex={0}
    >
      <div className={`absolute top-0 left-0 w-1 h-full ${isIncome ? 'bg-primary' : 'bg-red-500'} opacity-50`} />
      
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="font-grotesk font-semibold text-accent text-lg leading-tight tracking-tight">
            {budget.title}
          </span>
          <div className="flex gap-2 items-center flex-wrap">
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider mt-1 ${
              isIncome ? "bg-primary/10 text-primary" : "bg-red-500/10 text-red-500"
            }`}>
              {budget.category}
            </span>
            {budget.note && (
              <span className="text-secondary opacity-70 italic text-xs truncate max-w-[120px] mt-1">
                • {budget.note}
              </span>
            )}
          </div>
        </div>
        
        <div className={`font-grotesk text-xl font-bold ${isIncome ? "text-primary" : "text-red-400"}`}>
          {isIncome ? "+" : "-"}₹{Number(budget.amount).toLocaleString()}
        </div>
      </div>

      <div className="mt-2 pt-3 border-t border-secondary/10 flex items-center justify-between">
        <span className="text-xs text-secondary/70 flex items-center gap-1.5 font-medium uppercase tracking-wider">
          <FaRegCalendarAlt />
          {new Date(budget.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
          <button
            onClick={() => onEdit(budget)}
            className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary hover:bg-primary/20 hover:text-primary transition-colors"
            title="Edit"
          >
            <FaEdit className="text-[12px]"/>
          </button>
          <button
            onClick={onDelete}
            className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 hover:bg-red-500/20 transition-colors"
            title="Delete"
          >
            <FaTrash className="text-[12px]"/>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
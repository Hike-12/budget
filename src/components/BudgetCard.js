import { motion } from "framer-motion";
import { FaRegCalendarAlt, FaTrash } from "react-icons/fa";

export default function BudgetCard({ budget, onDelete }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-dark border ${
        budget.type === "income" ? "border-primary" : "border-red-500"
      } rounded-xl p-6 shadow-lg flex flex-col gap-2 hover:scale-[1.02] transition`}
      tabIndex={0}
      aria-label={`Budget: ${budget.title}, Amount: ${budget.amount}`}
    >
      <div className="flex items-center gap-2 justify-between">
        <span className="font-grotesk text-xl text-accent">{budget.title}</span>
        <span
          className={`px-2 py-1 rounded text-xs font-bold ${
            budget.type === "income"
              ? "bg-primary/20 text-primary"
              : "bg-red-500/20 text-red-500"
          }`}
        >
          {budget.type}
        </span>
      </div>
      <span
        className={`font-bold text-2xl ${
          budget.type === "income" ? "text-primary" : "text-red-500"
        }`}
      >
        {budget.type === "income" ? "+" : "-"}₹ {budget.amount}
      </span>
      {budget.note && (
        <span className="text-secondary text-sm italic">{budget.note}</span>
      )}
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-secondary flex items-center gap-1">
          <FaRegCalendarAlt className="text-secondary" />
          {new Date(budget.createdAt).toLocaleDateString()}
        </span>
        <button
          onClick={() => onDelete(budget._id)}
          className="text-red-500 hover:text-red-700 transition"
          title="Delete"
        >
          <FaTrash />
        </button>
      </div>
    </motion.div>
  );
}
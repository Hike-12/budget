import { motion } from "framer-motion";
import { FaRegCalendarAlt, FaTrash, FaEdit } from "react-icons/fa";

export default function BudgetCard({ budget, onDelete, onEdit }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-dark border ${
        budget.type === "income" ? "border-primary" : "border-red-500"
      } rounded-lg p-4 shadow flex flex-col gap-1 transition`}
      tabIndex={0}
      aria-label={`Budget: ${budget.title}, Amount: ${budget.amount}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-grotesk text-base text-accent">{budget.title}</span>
        <span
          className={`px-2 py-0.5 rounded text-xs font-normal ${
            budget.type === "income"
              ? "bg-primary/10 text-primary"
              : "bg-red-500/10 text-red-500"
          }`}
        >
          {budget.type}
        </span>
      </div>
      <span
        className={`font-medium text-lg ${
          budget.type === "income" ? "text-primary" : "text-red-500"
        }`}
      >
        {budget.type === "income" ? "+" : "-"}₹ {budget.amount}
      </span>
      <div className="flex flex-wrap gap-2 items-center text-xs mt-1">
        <span className="text-secondary italic">{budget.category}</span>
        {budget.note && (
          <span className="text-secondary italic">| {budget.note}</span>
        )}
      </div>
      <div className="flex items-center justify-between mt-1">
        <span className="text-xs text-secondary flex items-center gap-1">
          <FaRegCalendarAlt className="text-secondary" />
          {new Date(budget.createdAt).toLocaleDateString()}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(budget)}
            className="text-secondary hover:text-primary transition text-xs"
            title="Edit"
          >
            <FaEdit />
          </button>
          <button
            onClick={() => onDelete(budget._id)}
            className="text-red-500 hover:text-red-700 transition text-xs"
            title="Delete"
          >
            <FaTrash />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
import { FaWallet } from "react-icons/fa";
import { motion } from "framer-motion";

export default function TotalBalance({ budgets }) {
  const total =
    budgets.reduce(
      (acc, b) =>
        b.type === "income"
          ? acc + b.amount
          : acc - b.amount,
      0
    );

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 bg-dark border border-primary rounded-2xl px-6 py-4 mb-8 shadow-lg"
    >
      <FaWallet className="text-primary text-2xl" />
      <div>
        <div className="font-grotesk text-lg text-accent font-bold">Total Balance</div>
        <div className={`text-2xl font-bold ${total >= 0 ? "text-primary" : "text-red-500"}`}>
          ₹ {total}
        </div>
      </div>
    </motion.div>
  );
}
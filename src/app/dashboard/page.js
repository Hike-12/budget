"use client";
import { useEffect, useState } from "react";
import BudgetCard from "@/components/BudgetCard";
import BudgetForm from "@/components/BudgetForm";
import TotalBalance from "@/components/TotalBalance";
import { motion } from "framer-motion";

export default function Dashboard() {
  const [budgets, setBudgets] = useState([]);

  async function fetchBudgets() {
    const res = await fetch("/api/budgets");
    const data = await res.json();
    setBudgets(data);
  }

  useEffect(() => {
    fetchBudgets();
  }, []);

  async function handleAddBudget(budget) {
    await fetch("/api/budgets", {
      method: "POST",
      body: JSON.stringify(budget),
    });
    fetchBudgets();
  }

  async function handleDeleteBudget(id) {
    await fetch("/api/budgets", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });
    fetchBudgets();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <TotalBalance budgets={budgets} />
      <BudgetForm onAdd={handleAddBudget} />
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-grotesk text-2xl text-accent mt-10 mb-6"
      >
        Transactions
      </motion.h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {budgets.map(budget => (
          <BudgetCard key={budget._id} budget={budget} onDelete={handleDeleteBudget} />
        ))}
      </div>
    </div>
  );
}
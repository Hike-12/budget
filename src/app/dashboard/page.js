"use client";
import { useEffect, useState, useMemo } from "react";
import BudgetCard from "@/components/BudgetCard";
import BudgetForm from "@/components/BudgetForm";
import TotalBalance from "@/components/TotalBalance";
import FilterBar from "@/components/FilterBar";
import { motion } from "framer-motion";

export default function Dashboard() {
  const [budgets, setBudgets] = useState([]);
  const [editing, setEditing] = useState(null);

  // Filtering & sorting state
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

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

  async function handleEditBudget(budget) {
    await fetch("/api/budgets", {
      method: "PUT",
      body: JSON.stringify(budget),
    });
    fetchBudgets();
  }

  // Filter and sort budgets
  const filteredBudgets = useMemo(() => {
    let arr = [...budgets];
    if (filterType !== "all") {
      arr = arr.filter(b => b.type === filterType);
    }
    if (filterCategory !== "all") {
      arr = arr.filter(b => b.category === filterCategory);
    }
    arr.sort((a, b) => {
      if (sortBy === "amount") {
        return sortOrder === "asc"
          ? a.amount - b.amount
          : b.amount - a.amount;
      } else {
        // createdAt
        return sortOrder === "asc"
          ? new Date(a.createdAt) - new Date(b.createdAt)
          : new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
    return arr;
  }, [budgets, filterType, filterCategory, sortBy, sortOrder]);

  return (
    <div className="max-w-3xl mx-auto px-2 py-8">
      <TotalBalance budgets={budgets} />
      <FilterBar
        filterType={filterType}
        setFilterType={setFilterType}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        filterCategory={filterCategory}
        setFilterCategory={setFilterCategory}
      />
      <BudgetForm
        onAdd={handleAddBudget}
        onEdit={handleEditBudget}
        editing={editing}
        setEditing={setEditing}
      />
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-grotesk text-lg text-accent mt-6 mb-3 font-normal"
      >
        Transactions
      </motion.h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredBudgets.map(budget => (
          <BudgetCard
            key={budget._id}
            budget={budget}
            onDelete={handleDeleteBudget}
            onEdit={setEditing}
          />
        ))}
        {filteredBudgets.length === 0 && (
          <div className="text-secondary text-sm text-center col-span-2 py-8">
            No transactions found.
          </div>
        )}
      </div>
    </div>
  );
}
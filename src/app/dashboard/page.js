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
  const [deleteId, setDeleteId] = useState(null);

  // Filtering & sorting state
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filterMonth, setFilterMonth] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [filterRange, setFilterRange] = useState("all");

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
    setDeleteId(null);
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
    // Filter by month/year
    if (filterMonth !== "all" || filterYear !== "all") {
      arr = arr.filter(b => {
        const d = new Date(b.createdAt);
        const monthMatch = filterMonth === "all" || d.getMonth() + 1 === Number(filterMonth);
        const yearMatch = filterYear === "all" || d.getFullYear() === Number(filterYear);
        return monthMatch && yearMatch;
      });
    }
    // Filter by range
    if (filterRange !== "all") {
      const now = new Date();
      arr = arr.filter(b => {
        const d = new Date(b.createdAt);
        if (filterRange === "week") {
          const weekAgo = new Date(now);
          weekAgo.setDate(now.getDate() - 7);
          return d >= weekAgo && d <= now;
        }
        if (filterRange === "month") {
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }
        if (filterRange === "year") {
          return d.getFullYear() === now.getFullYear();
        }
        return true;
      });
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
  }, [budgets, filterType, filterCategory, sortBy, sortOrder, filterMonth, filterYear, filterRange]);

  return (
    <div className="max-w-3xl mx-auto px-2 py-8">
      <TotalBalance budgets={budgets} />
      <div className="mb-6">
        <FilterBar
          filterType={filterType}
          setFilterType={setFilterType}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          filterCategory={filterCategory}
          setFilterCategory={setFilterCategory}
          filterMonth={filterMonth}
          setFilterMonth={setFilterMonth}
          filterYear={filterYear}
          setFilterYear={setFilterYear}
          filterRange={filterRange}
          setFilterRange={setFilterRange}
        />
      </div>
      <hr className="border-secondary mb-6" />
      <div className="mb-8">
        <BudgetForm
          onAdd={handleAddBudget}
          onEdit={handleEditBudget}
          editing={editing}
          setEditing={setEditing}
        />
      </div>
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
            onDelete={() => setDeleteId(budget._id)}
            onEdit={setEditing}
          />
        ))}
        {filteredBudgets.length === 0 && (
          <div className="text-secondary text-sm text-center col-span-2 py-8">
            No transactions found.
          </div>
        )}
      </div>
      {/* Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
          <div className="bg-dark border border-primary rounded-xl p-6 shadow-xl flex flex-col items-center">
            <span className="text-accent font-grotesk text-lg mb-2">Confirm Delete</span>
            <span className="text-secondary text-sm mb-4">Are you sure you want to delete this transaction?</span>
            <div className="flex gap-4">
              <button
                onClick={() => handleDeleteBudget(deleteId)}
                className="bg-red-500 text-dark px-4 py-2 rounded hover:bg-red-700 font-medium"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteId(null)}
                className="bg-secondary text-dark px-4 py-2 rounded hover:bg-primary font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
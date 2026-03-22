"use client";
import { useEffect, useState, useMemo } from "react";
import BudgetCard from "@/components/BudgetCard";
import BudgetForm from "@/components/BudgetForm";
import TotalBalance from "@/components/TotalBalance";
import FilterBar from "@/components/FilterBar";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiPlus, FiInbox, FiAlertTriangle, FiX,
  FiList, FiGrid,
} from "react-icons/fi";
import { LuLayoutGrid, LuGrid2X2, LuGrid3X3 } from "react-icons/lu";

/* ── Column-count icon mapping ── */
const GRID_OPTIONS = [
  { cols: "list", label: "List",   icon: <FiList strokeWidth={1.5} size={14} /> },
  { cols: 1,      label: "1 col",  icon: <FiGrid strokeWidth={1.5} size={13} /> },
  { cols: 2,      label: "2 col",  icon: <LuGrid2X2 strokeWidth={1.5} size={13} /> },
  { cols: 3,      label: "3 col",  icon: <LuGrid3X3 strokeWidth={1.5} size={13} /> },
  { cols: 4,      label: "4 col",  icon: <LuLayoutGrid strokeWidth={1.5} size={13} /> },
];

/* ── Modal backdrop ── */
function ModalBackdrop({ children, onClose }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative z-10 w-full"
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 12 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

/* ── Empty state ── */
function EmptyState({ onAdd }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08, type: "spring", stiffness: 120, damping: 22 }}
      className="col-span-full"
    >
      <div className="bg-[#0a0a0a] border border-white/6 rounded-xl px-8 py-16 text-center">
        <div className="w-12 h-12 rounded-lg bg-white/4 border border-white/8 flex items-center justify-center mx-auto mb-4">
          <FiInbox className="text-secondary/40 text-xl" strokeWidth={1.5} />
        </div>
        <h3 className="font-grotesk text-accent font-semibold text-base mb-2 tracking-tight">No transactions yet</h3>
        <p className="text-secondary/40 text-sm mb-6 max-w-xs mx-auto leading-relaxed">
          Start tracking your money — add your first income or expense.
        </p>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-white/10 text-accent/70 text-sm font-medium hover:text-accent hover:border-white/20 transition-all duration-150 active:scale-[0.98]"
        >
          <FiPlus strokeWidth={2.5} className="text-sm" />
          Add first transaction
        </button>
      </div>
    </motion.div>
  );
}

/* ── BudgetCard in list-view mode ── */
function BudgetListRow({ budget, onDelete, onEdit, index }) {
  const isIncome   = budget.type === "income";
  const accentColor = isIncome ? "#34d399" : "#f87171";
  const accentBg    = isIncome ? "rgba(52,211,153,0.08)"  : "rgba(248,113,113,0.08)";

  const dateStr = new Date(budget.createdAt).toLocaleDateString("en-IN", {
    month: "short", day: "numeric", year: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 140, damping: 22, delay: index * 0.03 }}
      className="group flex items-center gap-4 bg-[#0a0a0a] border border-white/6 rounded-lg px-4 py-3 hover:border-white/12 transition-all duration-150"
    >
      {/* Indicator */}
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: accentColor, opacity: 0.7 }} />

      {/* Title + note */}
      <div className="flex-1 min-w-0">
        <span className="font-grotesk font-medium text-accent text-sm truncate block">{budget.title}</span>
        {budget.note && <span className="text-[11px] text-secondary/35 italic truncate block">{budget.note}</span>}
      </div>

      {/* Category tag */}
      <span
        className="hidden sm:inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wide flex-shrink-0"
        style={{ background: accentBg, color: accentColor }}
      >
        {budget.category}
      </span>

      {/* Date */}
      <span className="text-[11px] text-secondary/35 flex-shrink-0 hidden md:block">{dateStr}</span>

      {/* Amount */}
      <span className="font-grotesk text-sm font-semibold tabular-nums flex-shrink-0" style={{ color: accentColor }}>
        {isIncome ? "+" : "−"}₹{Number(budget.amount).toLocaleString("en-IN")}
      </span>

      {/* Actions */}
      <div className="flex gap-1">
        <button
          onClick={() => onEdit(budget)}
          className="w-7 h-7 rounded-md bg-white/4 flex items-center justify-center text-secondary/40 hover:text-primary hover:bg-primary/8 transition-all duration-150 active:scale-95"
          aria-label="Edit"
        >
          <span className="text-[11px]">✎</span>
        </button>
        <button
          onClick={onDelete}
          className="w-7 h-7 rounded-md bg-white/4 flex items-center justify-center text-secondary/40 hover:text-red-400 hover:bg-red-500/8 transition-all duration-150 active:scale-95"
          aria-label="Delete"
        >
          <FiX strokeWidth={2} className="text-[11px]" />
        </button>
      </div>
    </motion.div>
  );
}

/* ── Main Dashboard ── */
export default function Dashboard() {
  const [budgets,  setBudgets]  = useState([]);
  const [editing,  setEditing]  = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [username, setUsername] = useState("");

  const [filterType,     setFilterType]     = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy,         setSortBy]         = useState("createdAt");
  const [sortOrder,      setSortOrder]      = useState("desc");
  const [filterMonth,    setFilterMonth]    = useState("all");
  const [filterYear,     setFilterYear]     = useState("all");
  const [filterRange,    setFilterRange]    = useState("all");
  const [search,         setSearch]         = useState("");
  const [gridCols,       setGridCols]       = useState(3); // 1, 2, 3, 4 or "list"

  useEffect(() => {
    setUsername(localStorage.getItem("username") || "");
  }, []);

  async function fetchBudgets() {
    if (!username) return setBudgets([]);
    try {
      const res  = await fetch(`/api/budgets?user=${username}`);
      const data = await res.json();
      setBudgets(Array.isArray(data) ? data : []);
    } catch { setBudgets([]); }
  }

  useEffect(() => { fetchBudgets(); }, [username]);

  async function handleAddBudget(budget) {
    await fetch("/api/budgets", {
      method: "POST",
      body: JSON.stringify({ ...budget, user: username }),
      headers: { "Content-Type": "application/json" },
    });
    fetchBudgets(); setShowForm(false);
  }

  async function handleDeleteBudget(id) {
    await fetch("/api/budgets", {
      method: "DELETE",
      body: JSON.stringify({ id, user: username }),
      headers: { "Content-Type": "application/json" },
    });
    setDeleteId(null); fetchBudgets();
  }

  async function handleEditBudget(budget) {
    await fetch("/api/budgets", {
      method: "PATCH",
      body: JSON.stringify({ ...budget, user: username }),
      headers: { "Content-Type": "application/json" },
    });
    fetchBudgets(); setShowForm(false); setEditing(null);
  }

  const filteredBudgets = useMemo(() => {
    let arr = [...(Array.isArray(budgets) ? budgets : [])];

    // Text search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      arr = arr.filter(b =>
        b.title?.toLowerCase().includes(q) ||
        b.note?.toLowerCase().includes(q)  ||
        b.category?.toLowerCase().includes(q)
      );
    }

    if (filterType !== "all")     arr = arr.filter(b => b.type === filterType);
    if (filterCategory !== "all") arr = arr.filter(b => b.category === filterCategory);

    if (filterMonth !== "all" || filterYear !== "all") {
      arr = arr.filter(b => {
        const d = new Date(b.createdAt);
        const mOk = filterMonth === "all" || d.getMonth() + 1 === Number(filterMonth);
        const yOk = filterYear  === "all" || d.getFullYear()  === Number(filterYear);
        return mOk && yOk;
      });
    }

    if (filterRange !== "all") {
      const now = new Date();
      arr = arr.filter(b => {
        const d = new Date(b.createdAt);
        if (filterRange === "week")  { const wa = new Date(now); wa.setDate(now.getDate() - 7); return d >= wa && d <= now; }
        if (filterRange === "month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        if (filterRange === "year")  return d.getFullYear() === now.getFullYear();
        return true;
      });
    }

    arr.sort((a, b) =>
      sortBy === "amount"
        ? sortOrder === "asc" ? a.amount - b.amount : b.amount - a.amount
        : sortOrder === "asc" ? new Date(a.createdAt) - new Date(b.createdAt) : new Date(b.createdAt) - new Date(a.createdAt)
    );

    return arr;
  }, [budgets, search, filterType, filterCategory, sortBy, sortOrder, filterMonth, filterYear, filterRange]);

  function openForm(budget = null) { setEditing(budget); setShowForm(true); }
  function closeForm()             { setShowForm(false);  setEditing(null); }

  const gridClass =
    gridCols === "list" ? "flex flex-col gap-2" :
    gridCols === 1      ? "grid grid-cols-1 gap-3 items-stretch" :
    gridCols === 2      ? "grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch" :
    gridCols === 3      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-stretch" :
                          "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-stretch";

  const greetingName = username
    ? `, ${username.charAt(0).toUpperCase() + username.slice(1)}`
    : "";

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-28 pb-16">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="mb-8"
      >
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/4 border border-white/8 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span className="text-primary/80 text-[10px] font-semibold uppercase tracking-[0.15em]">Overview</span>
        </div>
        <h1 className="font-grotesk text-3xl font-bold text-accent tracking-tight">
          Your finances{greetingName}
        </h1>
      </motion.div>

      {/* Balance widget */}
      <TotalBalance budgets={budgets} />

      {/* Controls row */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.08 }}
        className="flex flex-col sm:flex-row sm:items-start gap-3 mb-5"
      >
        <div className="flex-1 min-w-0">
          <FilterBar
            filterType={filterType}     setFilterType={setFilterType}
            sortBy={sortBy}             setSortBy={setSortBy}
            sortOrder={sortOrder}       setSortOrder={setSortOrder}
            filterCategory={filterCategory} setFilterCategory={setFilterCategory}
            filterMonth={filterMonth}   setFilterMonth={setFilterMonth}
            filterYear={filterYear}     setFilterYear={setFilterYear}
            filterRange={filterRange}   setFilterRange={setFilterRange}
            search={search}             setSearch={setSearch}
          />
        </div>

        {/* Add button */}
        <button
          id="add-transaction-btn"
          onClick={() => openForm()}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-dark text-sm font-bold rounded-lg hover:bg-secondary transition-all duration-200 active:scale-[0.97] flex-shrink-0"
        >
          <FiPlus strokeWidth={2.5} className="text-sm" />
          Add
        </button>
      </motion.div>

      {/* Section header with grid selector */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.12 }}
        className="flex items-center justify-between mb-4"
      >
        <h2 className="font-grotesk text-accent/70 text-sm font-semibold tracking-tight">
          Transactions
          {filteredBudgets.length > 0 && (
            <span className="ml-2 text-secondary/35 font-normal tabular-nums">{filteredBudgets.length}</span>
          )}
        </h2>

        {/* Grid / List view toggle */}
        <div className="flex items-center gap-0.5 bg-[#0a0a0a] border border-white/8 rounded-lg p-1">
          {GRID_OPTIONS.map(opt => (
            <button
              key={opt.cols}
              onClick={() => setGridCols(opt.cols)}
              title={opt.label}
              aria-label={opt.label}
              className={`w-7 h-7 flex items-center justify-center rounded-md transition-all duration-150 ${
                gridCols === opt.cols
                  ? "bg-white/8 text-accent"
                  : "text-secondary/35 hover:text-accent"
              }`}
            >
              {opt.icon}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Transaction list / grid */}
      <div className={gridClass}>
        <AnimatePresence mode="popLayout">
          {filteredBudgets.length === 0
            ? <EmptyState key="empty" onAdd={() => openForm()} />
            : gridCols === "list"
              ? filteredBudgets.map((b, i) => (
                <BudgetListRow
                  key={b._id} budget={b} index={i}
                  onDelete={() => setDeleteId(b._id)}
                  onEdit={() => openForm(b)}
                />
              ))
              : filteredBudgets.map((b, i) => (
                <BudgetCard
                  key={b._id} budget={b} index={i}
                  onDelete={() => setDeleteId(b._id)}
                  onEdit={() => openForm(b)}
                />
              ))
          }
        </AnimatePresence>
      </div>

      {/* ── Delete confirmation modal ── */}
      <AnimatePresence>
        {deleteId && (
          <ModalBackdrop onClose={() => setDeleteId(null)}>
            <div className="max-w-sm mx-auto">
              <div className="bg-[#080808] border border-white/10 rounded-xl p-6 relative">
                {/* Close */}
                <button
                  onClick={() => setDeleteId(null)}
                  className="absolute top-4 right-4 w-7 h-7 rounded-md bg-white/4 flex items-center justify-center text-secondary/40 hover:text-accent hover:bg-white/8 transition-all duration-150"
                  aria-label="Close"
                >
                  <FiX strokeWidth={2} className="text-sm" />
                </button>

                <div className="w-10 h-10 rounded-lg bg-red-500/8 border border-red-500/15 flex items-center justify-center mb-4">
                  <FiAlertTriangle className="text-red-400 text-base" strokeWidth={1.5} />
                </div>
                <h3 className="font-grotesk text-accent font-semibold text-base mb-1 tracking-tight">Delete transaction?</h3>
                <p className="text-secondary/40 text-sm mb-5">This action cannot be undone.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDeleteId(null)}
                    className="flex-1 py-2.5 rounded-lg border border-white/8 text-secondary/60 text-sm font-medium hover:text-accent hover:border-white/15 transition-all duration-150 active:scale-[0.98]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteBudget(deleteId)}
                    className="flex-1 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/15 transition-all duration-150 active:scale-[0.98]"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </ModalBackdrop>
        )}
      </AnimatePresence>

      {/* ── Add / Edit form modal ── */}
      <AnimatePresence>
        {showForm && (
          <ModalBackdrop onClose={closeForm}>
            <div className="max-w-lg mx-auto relative">
              {/* Floating close button */}
              <button
                onClick={closeForm}
                className="absolute -top-3 -right-3 z-20 w-8 h-8 rounded-lg bg-[#111] border border-white/10 flex items-center justify-center text-secondary/50 hover:text-accent hover:border-white/20 transition-all duration-150 shadow-lg"
                aria-label="Close form"
              >
                <FiX strokeWidth={2} className="text-sm" />
              </button>
              <BudgetForm
                onAdd={handleAddBudget}
                onEdit={handleEditBudget}
                editing={editing}
                setEditing={setEditing}
              />
            </div>
          </ModalBackdrop>
        )}
      </AnimatePresence>
    </main>
  );
}
"use client";
import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import BudgetCard from "@/components/BudgetCard";
import BudgetForm from "@/components/BudgetForm";
import TotalBalance from "@/components/TotalBalance";
import FilterBar from "@/components/FilterBar";
import CustomSelect from "@/components/CustomSelect";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/components/sonner";
import {
  FiPlus, FiInbox, FiAlertTriangle, FiX,
  FiList, FiGrid, FiEye, FiEyeOff
} from "react-icons/fi";
import { LuLayoutGrid, LuGrid2X2, LuGrid3X3 } from "react-icons/lu";

/* ── Column-count icon mapping ── */
const GRID_OPTIONS = [
  { cols: "list", label: "List", icon: <FiList strokeWidth={1.5} size={14} /> },
  { cols: 1, label: "1 col", icon: <FiGrid strokeWidth={1.5} size={13} /> },
  { cols: 2, label: "2 col", icon: <LuGrid2X2 strokeWidth={1.5} size={13} /> },
  { cols: 3, label: "3 col", icon: <LuGrid3X3 strokeWidth={1.5} size={13} /> },
  { cols: 4, label: "4 col", icon: <LuLayoutGrid strokeWidth={1.5} size={13} /> },
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
        <h3 className="font-grotesk text-accent font-semibold text-lg mb-1 tracking-tight">Your canvas is clear</h3>
        <p className="text-secondary/40 text-sm mb-6 max-w-xs mx-auto leading-relaxed">
          Start your financial story. Add your first income or expense tracking now!
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
  const isIncome = budget.type === "income";
  const accentColor = isIncome ? "#34d399" : "#f87171";
  const accentBg = isIncome ? "rgba(52,211,153,0.08)" : "rgba(248,113,113,0.08)";

  const dateStr = new Date(budget.createdAt).toLocaleDateString("en-IN", {
    month: "short", day: "numeric", year: "numeric",
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -4, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 350, damping: 26, delay: index * 0.02 }}
      whileHover={{ scale: 1.005, backgroundColor: "rgba(255,255,255,0.02)" }}
      whileTap={{ scale: 0.99 }}
      className="group flex items-center gap-4 bg-[#0a0a0a] border border-white/6 rounded-lg px-4 py-3 hover:border-white/12 transition-all duration-150 will-change-transform"
    >
      {/* Indicator */}
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: accentColor, opacity: 0.7 }} />

      {/* Title + note */}
      <div className="flex-1 min-w-0">
        <span className="font-grotesk font-medium text-accent text-sm truncate block">{budget.title}</span>
        {budget.note && <span className="text-[11px] text-secondary/35 italic truncate block">{budget.note}</span>}
      </div>

      {/* Category tag */}
      <div className="hidden sm:flex items-center justify-start w-28 flex-shrink-0">
        <span
          className="px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wide"
          style={{ background: accentBg, color: accentColor }}
        >
          {budget.category}
        </span>
      </div>

      {/* Date */}
      <span className="text-[11px] text-secondary/35 flex-shrink-0 hidden md:block w-24 text-right">{dateStr}</span>

      {/* Amount */}
      <span className="font-grotesk text-sm font-semibold tabular-nums flex-shrink-0 w-28 text-right" style={{ color: accentColor }}>
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
  const router = useRouter();
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const authToastRef = useRef(false);
  const [budgets, setBudgets] = useState([]);
  const [editing, setEditing] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [username, setUsername] = useState("");

  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filterMonth, setFilterMonth] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [filterRange, setFilterRange] = useState("all");
  const [search, setSearch] = useState("");
  const [gridCols, setGridCols] = useState(3); // 1, 2, 3, 4 or "list"
  const [isBlurred, setIsBlurred] = useState(true);

  const [isLoadingBudgets, setIsLoadingBudgets] = useState(true);
  const [pageSize, setPageSize] = useState(100);
  const [visibleCount, setVisibleCount] = useState(100);

  useEffect(() => {
    const storedUser = localStorage.getItem("username");
    if (!storedUser) {
      if (!authToastRef.current) {
        toast.error("Please login to view dashboard");
        authToastRef.current = true;
      }
      router.push("/login");
      return;
    }
    setUsername(storedUser);
    setIsAuthChecking(false);
    const storedBlur = localStorage.getItem("isBlurred");
    if (storedBlur !== null) {
      setIsBlurred(storedBlur === "true");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("isBlurred", isBlurred);
  }, [isBlurred]);

  async function fetchBudgets() {
    if (!username) return;
    try {
      if (budgets.length === 0) setIsLoadingBudgets(true);
      const res = await fetch(`/api/budgets?user=${username}`);
      const data = await res.json();
      setBudgets(Array.isArray(data) ? data : []);
    } catch { setBudgets([]); }
    setIsLoadingBudgets(false);
  }

  useEffect(() => { fetchBudgets(); }, [username]);

  // Reset paging if sort/filter/search/pageSize changes
  useEffect(() => {
    setVisibleCount(pageSize);
  }, [search, filterType, filterCategory, sortBy, sortOrder, filterMonth, filterYear, filterRange, pageSize]);

  async function handleAddBudget(budget) {
    const res = await fetch("/api/budgets", {
      method: "POST",
      body: JSON.stringify({ ...budget, user: username }),
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) toast.success(`Added "${budget.title}" successfully`);
    else toast.error("Failed to add transaction");

    fetchBudgets(); setShowForm(false);
  }

  async function handleDeleteBudget(item) {
    const res = await fetch("/api/budgets", {
      method: "DELETE",
      body: JSON.stringify({ id: item._id, user: username }),
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) toast.success(`Deleted "${item.title}"`);
    else toast.error("Failed to delete transaction");

    setDeleteItem(null); fetchBudgets();
  }

  async function handleEditBudget(budget) {
    const res = await fetch("/api/budgets", {
      method: "PATCH",
      body: JSON.stringify({ ...budget, user: username }),
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) toast.success(`Updated "${budget.title}"`);
    else toast.error("Failed to update transaction");

    fetchBudgets(); setShowForm(false); setEditing(null);
  }

  const filteredBudgets = useMemo(() => {
    let arr = [...(Array.isArray(budgets) ? budgets : [])];

    // Text search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      arr = arr.filter(b =>
        b.title?.toLowerCase().includes(q) ||
        b.note?.toLowerCase().includes(q) ||
        b.category?.toLowerCase().includes(q)
      );
    }

    if (filterType !== "all") arr = arr.filter(b => b.type === filterType);
    if (filterCategory !== "all") arr = arr.filter(b => b.category === filterCategory);

    if (filterMonth !== "all" || filterYear !== "all") {
      arr = arr.filter(b => {
        const d = new Date(b.createdAt);
        const mOk = filterMonth === "all" || d.getMonth() + 1 === Number(filterMonth);
        const yOk = filterYear === "all" || d.getFullYear() === Number(filterYear);
        return mOk && yOk;
      });
    }

    if (filterRange !== "all") {
      const now = new Date();
      arr = arr.filter(b => {
        const d = new Date(b.createdAt);
        if (filterRange === "week") { const wa = new Date(now); wa.setDate(now.getDate() - 7); return d >= wa && d <= now; }
        if (filterRange === "month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        if (filterRange === "year") return d.getFullYear() === now.getFullYear();
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

  // Reset visible count whenever filters/search change
  useEffect(() => {
    setVisibleCount(pageSize);
  }, [search, filterType, filterCategory, sortBy, sortOrder, filterMonth, filterYear, filterRange, pageSize]);

  function openForm(budget = null) { setEditing(budget); setShowForm(true); }
  function closeForm() { setShowForm(false); setEditing(null); }

  const gridClass =
    gridCols === "list" ? "flex flex-col gap-2" :
      gridCols === 1 ? "grid grid-cols-1 gap-3 items-stretch" :
        gridCols === 2 ? "grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch" :
          gridCols === 3 ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-stretch" :
            "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-stretch";

  const greetingName = username
    ? `, ${username.charAt(0).toUpperCase() + username.slice(1)}`
    : "";

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className={`max-w-5xl mx-auto px-4 sm:px-6 pt-28 pb-16 ${isBlurred ? "blur-numbers" : ""}`}>
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="mb-8 flex items-end justify-between gap-4"
      >
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/4 border border-white/8 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="text-primary/80 text-[10px] font-semibold uppercase tracking-[0.15em]">Overview</span>
          </div>
          <h1 className="font-grotesk text-3xl font-semibold text-accent tracking-tight">
            Your finances{greetingName}
          </h1>
        </div>

        {/* Privacy Toggle Button */}
        <button
          onClick={() => setIsBlurred(prev => !prev)}
          aria-label={isBlurred ? "Show numbers" : "Hide numbers"}
          title={isBlurred ? "Show numbers" : "Hide numbers"}
          className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-white/4 border border-white/10 text-secondary/60 hover:text-accent hover:bg-white/10 hover:border-white/15 transition-all duration-200 active:scale-95"
        >
          {isBlurred ? <FiEyeOff strokeWidth={1.5} size={18} /> : <FiEye strokeWidth={1.5} size={18} />}
        </button>
      </motion.div>

      {/* Balance widget — reflects active filters */}
      <TotalBalance budgets={filteredBudgets} />

      {/* Controls row */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.08 }}
        className="flex flex-col sm:flex-row sm:items-start gap-3 mb-5"
      >
        <div className="flex-1 min-w-0">
          <FilterBar
            filterType={filterType} setFilterType={setFilterType}
            sortBy={sortBy} setSortBy={setSortBy}
            sortOrder={sortOrder} setSortOrder={setSortOrder}
            filterCategory={filterCategory} setFilterCategory={setFilterCategory}
            filterMonth={filterMonth} setFilterMonth={setFilterMonth}
            filterYear={filterYear} setFilterYear={setFilterYear}
            filterRange={filterRange} setFilterRange={setFilterRange}
            search={search} setSearch={setSearch}
          />
        </div>

        {/* Add button */}
        <button
          id="add-transaction-btn"
          onClick={() => openForm()}
          className="flex flex-[0_0_auto] items-center justify-center gap-2 px-4 py-3 sm:py-2.5 w-full sm:w-auto bg-primary text-dark text-sm font-bold rounded-lg hover:bg-secondary transition-all duration-200 active:scale-95"
          aria-label="Add new transaction"
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
        className="flex items-end justify-between mb-4 gap-4"
      >
        <h2 className="font-grotesk text-accent/70 text-sm font-semibold tracking-tight flex-shrink-0 flex items-center gap-2">
          Transactions
          {!isLoadingBudgets && (
            <span className="text-secondary/35 font-normal tabular-nums">
              {filteredBudgets.length}{filteredBudgets.length !== budgets.length && ` of ${budgets.length}`}
            </span>
          )}
        </h2>

        <div className="flex items-center gap-3">
          {/* Page Size Dropdown */}
          <div className="hidden sm:block w-28">
            <CustomSelect
              value={pageSize}
              onChange={(val) => setPageSize(Number(val))}
              options={[
                { value: 25, label: "Show 25" },
                { value: 50, label: "Show 50" },
                { value: 75, label: "Show 75" },
                { value: 100, label: "Show 100" },
              ]}
              buttonClassName="!bg-[#0a0a0a] !border-white/8 !px-3 !py-1.5 !h-9 !text-xs !text-secondary/60 hover:!text-accent !rounded-lg"
            />
          </div>

          {/* Grid / List view toggle */}
          <div className="flex items-center gap-0.5 bg-[#0a0a0a] border border-white/8 rounded-lg p-1">
            {/* Universal Mobile Grid Button (hidden on desktop) */}
            <button
              onClick={() => setGridCols(typeof gridCols === "number" ? gridCols : 3)}
              title="Grid view"
              aria-label="Grid view"
              className={`w-7 h-7 flex sm:hidden items-center justify-center rounded-md transition-all duration-150 ${typeof gridCols === "number" ? "bg-white/8 text-accent" : "text-secondary/35 hover:text-accent"
                }`}
            >
              <FiGrid strokeWidth={1.5} size={13} />
            </button>

            {/* Individual Opts */}
            {GRID_OPTIONS.map(opt => {
              // 'List' shows everywhere. Multi-col + 1-col show ONLY on sm+
              const isDesktopOnly = opt.cols !== "list";
              return (
                <button
                  key={opt.cols}
                  onClick={() => setGridCols(opt.cols)}
                  title={opt.label}
                  aria-label={opt.label}
                  className={`w-7 h-7 items-center justify-center rounded-md transition-all duration-150 ${isDesktopOnly ? "hidden sm:flex" : "flex"
                    } ${gridCols === opt.cols
                      ? "bg-white/8 text-accent"
                      : "text-secondary/35 hover:text-accent"
                    }`}
                >
                  {opt.icon}
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Transaction list / grid */}
      <div className={gridClass}>
        <AnimatePresence mode="popLayout">
          {isLoadingBudgets && budgets.length === 0
            ? (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="col-span-full py-16 flex flex-col items-center justify-center"
                key="loader"
              >
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-sm font-medium text-secondary/40">Loading transactions...</p>
              </motion.div>
            )
            : filteredBudgets.length === 0
              ? <EmptyState key="empty" onAdd={() => openForm()} />
              : gridCols === "list"
                ? filteredBudgets.slice(0, visibleCount).map((b, i) => (
                  <BudgetListRow
                    key={b._id} budget={b} index={i}
                    onDelete={() => setDeleteItem(b)}
                    onEdit={() => openForm(b)}
                  />
                ))
                : filteredBudgets.slice(0, visibleCount).map((b, i) => (
                  <BudgetCard
                    key={b._id} budget={b} index={i}
                    onDelete={() => setDeleteItem(b)}
                    onEdit={() => openForm(b)}
                  />
                ))
          }
        </AnimatePresence>
      </div>

      {/* 'Show More' Button */}
      {!isLoadingBudgets && visibleCount < filteredBudgets.length && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="mt-8 flex justify-center"
        >
          <button
            onClick={() => setVisibleCount(prev => prev + pageSize)}
            className="px-6 py-2.5 rounded-full bg-white/4 border border-white/10 text-accent hover:bg-white/10 hover:border-white/20 hover:text-primary transition-all font-medium text-sm w-full sm:w-auto"
          >
            Load More Transactions
          </button>
        </motion.div>
      )}

      {/* ── Delete confirmation modal ── */}
      <AnimatePresence>
        {deleteItem && (
          <ModalBackdrop onClose={() => setDeleteItem(null)}>
            <div className="max-w-sm mx-auto">
              <div className="bg-[#080808] border border-white/10 rounded-xl p-6 relative">
                {/* Close */}
                <button
                  onClick={() => setDeleteItem(null)}
                  className="absolute top-4 right-4 w-7 h-7 rounded-md bg-white/4 flex items-center justify-center text-secondary/40 hover:text-accent hover:bg-white/8 transition-all duration-150"
                  aria-label="Close"
                >
                  <FiX strokeWidth={2} className="text-sm" />
                </button>

                <div className="w-10 h-10 rounded-lg bg-red-500/8 border border-red-500/15 flex items-center justify-center mb-4">
                  <FiAlertTriangle className="text-red-400 text-base" strokeWidth={1.5} />
                </div>
                <h3 className="font-grotesk text-accent font-semibold text-base mb-1 tracking-tight">Delete transaction?</h3>

                {/* Transaction Details */}
                <div className="bg-[#0e0e0e] border border-white/6 rounded-lg p-3 my-4">
                  <p className="text-sm font-medium text-accent break-words">{deleteItem.title}</p>
                  <p className="text-xs text-secondary/60 mt-1 capitalize">{deleteItem.category} • {new Date(deleteItem.createdAt).toLocaleDateString("en-IN")}</p>
                  <p className={`text-sm font-bold mt-2 tabular-nums ${deleteItem.type === "income" ? "text-emerald-400" : "text-red-400"}`}>
                    {deleteItem.type === "income" ? "+" : "−"}₹{Number(deleteItem.amount).toLocaleString("en-IN")}
                  </p>
                </div>

                <p className="text-secondary/40 text-sm mb-5">This action cannot be undone.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDeleteItem(null)}
                    className="flex-1 py-2.5 rounded-lg border border-white/8 text-secondary/60 text-sm font-medium hover:text-accent hover:border-white/15 transition-all duration-150 active:scale-[0.98]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteBudget(deleteItem)}
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
            <div className="w-full max-w-[540px] mx-auto relative">
              {/* Floating close button */}
              <button
                onClick={closeForm}
                className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 z-20 w-8 h-8 rounded-lg bg-[#111] border border-white/10 flex items-center justify-center text-secondary/50 hover:text-accent hover:border-white/20 transition-all duration-150 shadow-lg"
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
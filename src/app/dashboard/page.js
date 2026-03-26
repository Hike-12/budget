"use client";
import dynamic from "next/dynamic";
import {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
  useDeferredValue,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import BudgetCard from "@/components/BudgetCard";
import BudgetForm from "@/components/BudgetForm";
import TotalBalance from "@/components/TotalBalance";
import FilterBar from "@/components/FilterBar";
import CustomSelect from "@/components/CustomSelect";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/components/sonner";
import {
  FiPlus,
  FiInbox,
  FiAlertTriangle,
  FiX,
  FiList,
  FiGrid,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";
import { LuLayoutGrid, LuGrid2X2, LuGrid3X3 } from "react-icons/lu";

const AnalyticsTab = dynamic(() => import("@/components/AnalyticsTab"), {
  ssr: false,
  loading: () => (
    <div className="w-full flex flex-col gap-4 flex-1 animate-pulse pb-12 mt-4">
      <div className="h-[360px] w-full bg-[#0a0a0a] border border-white/5 rounded-2xl" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-[300px] w-full bg-[#0a0a0a] border border-white/5 rounded-2xl" />
        <div className="h-[300px] w-full bg-[#0a0a0a] border border-white/5 rounded-2xl" />
      </div>
    </div>
  ),
});

/* ── Column-count icon mapping ── */
const GRID_OPTIONS = [
  { cols: "list", label: "List", icon: <FiList strokeWidth={1.5} size={14} /> },
  { cols: 1, label: "1 col", icon: <FiGrid strokeWidth={1.5} size={13} /> },
  { cols: 2, label: "2 col", icon: <LuGrid2X2 strokeWidth={1.5} size={13} /> },
  { cols: 3, label: "3 col", icon: <LuGrid3X3 strokeWidth={1.5} size={13} /> },
  {
    cols: 4,
    label: "4 col",
    icon: <LuLayoutGrid strokeWidth={1.5} size={13} />,
  },
];

const DEFAULT_PAGE_SIZE = 25;

/* ── API helpers (plain async fns — used by useMutation) ── */
async function fetchBudgetsApi(username, signal) {
  const res = await fetch(`/api/budgets?user=${username}`, { signal });
  if (!res.ok) throw new Error("Failed to fetch budgets");
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function addBudgetApi({ budget, username }) {
  const res = await fetch("/api/budgets", {
    method: "POST",
    body: JSON.stringify({ ...budget, user: username }),
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Failed to add transaction");
  return res.json();
}

async function deleteBudgetApi({ item, username }) {
  const res = await fetch("/api/budgets", {
    method: "DELETE",
    body: JSON.stringify({ id: item._id, user: username }),
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Failed to delete transaction");
  return res.json();
}

async function editBudgetApi({ budget, username }) {
  const res = await fetch("/api/budgets", {
    method: "PATCH",
    body: JSON.stringify({ ...budget, user: username }),
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Failed to update transaction");
  return res.json();
}

/* ── Modal backdrop ── */
function ModalBackdrop({ children, onClose }) {
  const handleWrapperClick = (e) => {
    if (e.target.id === "modal-wrapper") onClose();
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        id="modal-wrapper"
        className="relative z-10 w-full h-full flex items-center justify-center"
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 12 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        onClick={handleWrapperClick}
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
      <div className="bg-transparent border border-dashed border-white/10 rounded-xl px-8 py-16 text-center">
        <div className="w-12 h-12 rounded-lg bg-white/4 border border-white/8 flex items-center justify-center mx-auto mb-4">
          <FiInbox className="text-secondary/40 text-xl" strokeWidth={1.5} />
        </div>
        <h3 className="font-grotesk text-accent font-semibold text-lg mb-1 tracking-tight">
          Your canvas is clear
        </h3>
        <p className="text-secondary/40 text-sm mb-6 max-w-xs mx-auto leading-relaxed">
          Start your financial story. Add your first income or expense tracking
          now!
        </p>
        <button
          onClick={() => onAdd()}
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
  const accentBg = isIncome
    ? "rgba(52,211,153,0.08)"
    : "rgba(248,113,113,0.08)";

  const dateStr = useMemo(
    () =>
      new Date(budget.createdAt).toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    [budget.createdAt],
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -4, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      whileHover={{ scale: 1.005, backgroundColor: "rgba(255,255,255,0.02)" }}
      whileTap={{ scale: 0.99 }}
      className="group flex items-center gap-4 bg-[#0a0a0a] border border-white/6 rounded-lg px-4 py-3 hover:border-white/12 transition-all duration-150 will-change-transform"
    >
      {/* Indicator */}
      <div
        className="w-2 h-2 rounded-full shrink-0"
        style={{ background: accentColor, opacity: 0.7 }}
      />

      {/* Title + note */}
      <div className="flex-1 min-w-0">
        <span className="font-grotesk font-medium text-accent text-sm truncate block">
          {budget.title}
        </span>
        {budget.note && (
          <span className="text-[11px] text-secondary/35 italic truncate block">
            {budget.note}
          </span>
        )}
      </div>

      {/* Category tag */}
      <div className="hidden sm:flex items-center justify-start w-28 shrink-0">
        <span
          className="px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wide"
          style={{ background: accentBg, color: accentColor }}
        >
          {budget.category}
        </span>
      </div>

      {/* Date */}
      <span className="text-[11px] text-secondary/35 shrink-0 hidden md:block w-24 text-right">
        {dateStr}
      </span>

      {/* Amount */}
      <span
        className="font-grotesk text-sm font-semibold tabular-nums shrink-0 w-28 text-right"
        style={{ color: accentColor }}
      >
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

/* ── Skeletons for Loading State ── */
function BudgetListRowSkeleton() {
  return (
    <div className="flex items-center gap-4 bg-[#0a0a0a] border border-white/6 rounded-lg px-4 py-3 animate-pulse">
      <div className="w-2 h-2 rounded-full shrink-0 bg-white/10" />
      <div className="flex-1 min-w-0">
        <div className="h-3.5 bg-white/10 rounded w-32 mb-1.5" />
        <div className="h-2 bg-white/5 rounded w-20" />
      </div>
      <div className="hidden sm:flex items-center justify-start w-28 shrink-0">
        <div className="h-4 bg-white/10 rounded w-16" />
      </div>
      <div className="hidden md:block w-24 shrink-0">
        <div className="h-2.5 bg-white/10 rounded w-14 ml-auto" />
      </div>
      <div className="w-28 shrink-0 flex justify-end">
        <div className="h-3.5 bg-white/10 rounded w-16" />
      </div>
      <div className="flex gap-1">
        <div className="w-7 h-7 rounded-md bg-white/5" />
        <div className="w-7 h-7 rounded-md bg-white/5" />
      </div>
    </div>
  );
}

function BudgetCardSkeleton() {
  return (
    <div className="relative bg-[#0a0a0a] border border-white/5 rounded-xl p-4 flex flex-col h-[130px] animate-pulse">
      <div className="absolute top-3 bottom-3 left-0 w-[3px] rounded-r-full bg-white/10" />
      <div className="pl-3 flex items-start justify-between gap-3 mb-2 mt-1">
        <div className="h-3.5 bg-white/10 rounded w-1/2" />
        <div className="h-3.5 bg-white/10 rounded w-16" />
      </div>
      <div className="pl-3 flex items-center gap-2 mt-2">
        <div className="h-4 bg-white/10 rounded w-16" />
        <div className="h-4 bg-white/5 rounded w-20" />
      </div>
      <div className="pl-3 mt-auto border-t border-white/5 pt-2 flex justify-between items-center">
        <div className="h-2.5 bg-white/5 rounded w-16" />
        <div className="flex gap-1">
          <div className="w-7 h-7 rounded-lg bg-white/5" />
          <div className="w-7 h-7 rounded-lg bg-white/5" />
        </div>
      </div>
    </div>
  );
}

/* ── Main Dashboard ── */
export default function Dashboard() {
  const router = useRouter();
  const qc = useQueryClient();
  const authToastRef = useRef(false);
  const [isFilterPending, startFilterTransition] = useTransition();

  /* ── Hydration-safe auth + preferences ──
     Both server and client start with isReady=false / username=""
     so the initial render is identical (loading spinner).
     A single mount effect reads localStorage and resolves state. */
  const [isReady, setIsReady] = useState(false);
  const [username, setUsername] = useState("");
  const [isBlurred, setIsBlurred] = useState(true);

  // Tab State
  const [activeTab, setActiveTab] = useState("transactions"); // "transactions" or "analytics"

  useEffect(() => {
    router.prefetch("/login");
  }, [router]);

  useEffect(() => {
    const storedUser = localStorage.getItem("username") ?? "";
    if (!storedUser) {
      if (!authToastRef.current) {
        toast.error("Please login to view dashboard");
        authToastRef.current = true;
      }
      router.replace("/login");
      return;
    }
    setUsername(storedUser);
    const storedBlur = localStorage.getItem("isBlurred");
    if (storedBlur !== null) setIsBlurred(storedBlur === "true");
    setIsReady(true);
  }, [router]);

  useEffect(() => {
    const onAuthChange = () => {
      const storedUser = localStorage.getItem("username") ?? "";
      if (!storedUser) {
        router.replace("/login");
        return;
      }
      setUsername(storedUser);
    };

    window.addEventListener("auth-change", onAuthChange);
    return () => window.removeEventListener("auth-change", onAuthChange);
  }, [router]);

  const toggleBlur = useCallback(() => {
    setIsBlurred((prev) => {
      const next = !prev;
      localStorage.setItem("isBlurred", next);
      return next;
    });
  }, []);

  /* ── UI State ── */
  const [editing, setEditing] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filterMonth, setFilterMonth] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [filterRange, setFilterRange] = useState("all");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [gridCols, setGridCols] = useState(3);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [visibleCount, setVisibleCount] = useState(DEFAULT_PAGE_SIZE);

  /* ── Data: useQuery replaces useEffect + fetch ── */
  const { data: budgets = [], isLoading: isLoadingBudgets } = useQuery({
    queryKey: ["budgets", username],
    queryFn: ({ signal }) => fetchBudgetsApi(username, signal),
    enabled: !!username,
  });

  /* ── Mutations ── */
  const invalidate = useCallback(
    () => qc.invalidateQueries({ queryKey: ["budgets", username] }),
    [qc, username],
  );

  const addMutation = useMutation({
    mutationFn: (budget) => addBudgetApi({ budget, username }),
    onSuccess: (_, budget) => {
      toast.success(`Added "${budget.title}" successfully`);
      invalidate();
      setShowForm(false);
    },
    onError: () => toast.error("Failed to add transaction"),
  });

  const deleteMutation = useMutation({
    mutationFn: (item) => deleteBudgetApi({ item, username }),
    onSuccess: (_, item) => {
      toast.success(`Deleted "${item.title}"`);
      invalidate();
      setDeleteItem(null);
    },
    onError: () => toast.error("Failed to delete transaction"),
  });

  const editMutation = useMutation({
    mutationFn: (budget) => editBudgetApi({ budget, username }),
    onSuccess: (_, budget) => {
      toast.success(`Updated "${budget.title}"`);
      invalidate();
      setShowForm(false);
      setEditing(null);
    },
    onError: () => toast.error("Failed to update transaction"),
  });

  const budgetsPrepared = useMemo(
    () =>
      budgets.map((b) => {
        const createdAtTs = new Date(b.createdAt).getTime();
        return {
          ...b,
          _createdAtTs: createdAtTs,
          _amountNum: Number(b.amount),
          _searchText:
            `${b.title ?? ""} ${b.note ?? ""} ${b.category ?? ""}`.toLowerCase(),
          _monthNum: new Date(createdAtTs).getMonth() + 1,
          _yearNum: new Date(createdAtTs).getFullYear(),
        };
      }),
    [budgets],
  );

  /* ── Filtering & sorting: useMemo replaces useEffect ── */
  const filteredBudgets = useMemo(() => {
    let arr = [...budgetsPrepared];
    const now = Date.now();
    const weekAgoTs = now - 7 * 24 * 60 * 60 * 1000;
    const nowDate = new Date(now);
    const nowMonth = nowDate.getMonth() + 1;
    const nowYear = nowDate.getFullYear();

    if (deferredSearch.trim()) {
      const q = deferredSearch.trim().toLowerCase();
      arr = arr.filter((b) => b._searchText.includes(q));
    }

    if (filterType !== "all") arr = arr.filter((b) => b.type === filterType);
    if (filterCategory !== "all")
      arr = arr.filter((b) => b.category === filterCategory);

    if (filterMonth !== "all" || filterYear !== "all") {
      arr = arr.filter((b) => {
        const mOk =
          filterMonth === "all" || b._monthNum === Number(filterMonth);
        const yOk = filterYear === "all" || b._yearNum === Number(filterYear);
        return mOk && yOk;
      });
    }

    if (filterRange !== "all") {
      arr = arr.filter((b) => {
        if (filterRange === "week") return b._createdAtTs >= weekAgoTs;
        if (filterRange === "month")
          return b._monthNum === nowMonth && b._yearNum === nowYear;
        if (filterRange === "year") return b._yearNum === nowYear;
        return true;
      });
    }

    arr.sort((a, b) =>
      sortBy === "amount"
        ? sortOrder === "asc"
          ? a._amountNum - b._amountNum
          : b._amountNum - a._amountNum
        : sortOrder === "asc"
          ? a._createdAtTs - b._createdAtTs
          : b._createdAtTs - a._createdAtTs,
    );

    return arr;
  }, [
    budgetsPrepared,
    deferredSearch,
    filterType,
    filterCategory,
    sortBy,
    sortOrder,
    filterMonth,
    filterYear,
    filterRange,
  ]);

  const visibleBudgets = useMemo(
    () => filteredBudgets.slice(0, visibleCount),
    [filteredBudgets, visibleCount],
  );

  const loadStep = useMemo(
    () => (pageSize === "all" ? DEFAULT_PAGE_SIZE : Number(pageSize)),
    [pageSize],
  );
  const shownCount = Math.min(visibleCount, filteredBudgets.length);

  const setFilterTypeSmooth = useCallback(
    (value) => startFilterTransition(() => setFilterType(value)),
    [startFilterTransition],
  );
  const setSortBySmooth = useCallback(
    (value) => startFilterTransition(() => setSortBy(value)),
    [startFilterTransition],
  );
  const setSortOrderSmooth = useCallback(
    (value) => startFilterTransition(() => setSortOrder(value)),
    [startFilterTransition],
  );
  const setFilterCategorySmooth = useCallback(
    (value) => startFilterTransition(() => setFilterCategory(value)),
    [startFilterTransition],
  );
  const setFilterMonthSmooth = useCallback(
    (value) => startFilterTransition(() => setFilterMonth(value)),
    [startFilterTransition],
  );
  const setFilterYearSmooth = useCallback(
    (value) => startFilterTransition(() => setFilterYear(value)),
    [startFilterTransition],
  );
  const setFilterRangeSmooth = useCallback(
    (value) => startFilterTransition(() => setFilterRange(value)),
    [startFilterTransition],
  );

  /* ── visibleCount resets when filter keys change (derived, not an effect) ── */
  // We track these as a stable key to compare — no useEffect needed
  const filterKey = `${deferredSearch}|${filterType}|${filterCategory}|${sortBy}|${sortOrder}|${filterMonth}|${filterYear}|${filterRange}|${pageSize}`;
  const lastFilterKeyRef = useRef(filterKey);
  useEffect(() => {
    if (lastFilterKeyRef.current !== filterKey) {
      lastFilterKeyRef.current = filterKey;
      setVisibleCount(
        pageSize === "all" ? filteredBudgets.length : Number(pageSize),
      );
    }
  }, [filterKey, pageSize, filteredBudgets.length]);

  useEffect(() => {
    if (pageSize === "all" && visibleCount !== filteredBudgets.length) {
      setVisibleCount(filteredBudgets.length);
    }
  }, [pageSize, filteredBudgets.length, visibleCount]);

  /* ── Stable callbacks ── */
  const openForm = useCallback((budget = null) => {
    setEditing(budget);
    setShowForm(true);
  }, []);
  const closeForm = useCallback(() => {
    setShowForm(false);
    setEditing(null);
  }, []);

  const gridClass = useMemo(
    () =>
      gridCols === "list"
        ? "flex flex-col gap-2"
        : gridCols === 1
          ? "grid grid-cols-1 gap-3 items-stretch"
          : gridCols === 2
            ? "grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch"
            : gridCols === 3
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-stretch"
              : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-stretch",
    [gridCols],
  );

  const greetingName = useMemo(
    () =>
      username
        ? `, ${username.charAt(0).toUpperCase() + username.slice(1)}`
        : "",
    [username],
  );

  if (!isReady) {
    return (
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-28 pb-16">
        <div className="mb-8 flex items-end justify-between gap-4 animate-pulse">
          <div>
            <div className="w-20 h-6 bg-white/5 rounded-md mb-3" />
            <div className="w-48 h-8 bg-white/10 rounded-md" />
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10" />
        </div>

        {/* Mock TotalBalance */}
        <div className="mb-8 bg-[#0a0a0a] border border-white/8 rounded-xl p-6 animate-pulse">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-lg bg-white/4 border border-white/8 shrink-0" />
              <div>
                <div className="w-20 h-3 bg-white/5 rounded mb-2" />
                <div className="h-10 w-32 bg-white/10 rounded" />
              </div>
            </div>
            <div className="flex items-stretch gap-2">
              <div className="min-w-[130px] h-14 bg-white/5 border border-white/6 rounded-lg" />
              <div className="min-w-[130px] h-14 bg-white/5 border border-white/6 rounded-lg" />
            </div>
          </div>
        </div>

        {/* Mock Tabs & Controls */}
        <div className="flex gap-2 mb-6 border-b border-white/10 pb-2 animate-pulse">
          <div className="w-24 h-9 bg-white/10 rounded-lg" />
          <div className="w-24 h-9 bg-white/5 rounded-lg" />
        </div>
        <div className="flex gap-3 mb-5 animate-pulse">
          <div className="h-10 flex-1 bg-white/5 rounded-lg" />
          <div className="w-24 h-10 bg-white/10 rounded-lg" />
        </div>

        {/* Mock Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <BudgetCardSkeleton />
          <BudgetCardSkeleton />
          <BudgetCardSkeleton />
        </div>
      </main>
    );
  }

  return (
    <main
      className={`max-w-5xl mx-auto px-4 sm:px-6 pt-28 pb-16 ${isBlurred ? "blur-numbers" : ""}`}
    >
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
            <span className="text-primary/80 text-[10px] font-semibold uppercase tracking-[0.15em]">
              Overview
            </span>
          </div>
          <h1 className="font-grotesk text-3xl font-semibold text-accent tracking-tight">
            Your finances{greetingName}
          </h1>
        </div>

        {/* Privacy Toggle */}
        <button
          onClick={toggleBlur}
          aria-label={isBlurred ? "Show numbers" : "Hide numbers"}
          title={isBlurred ? "Show numbers" : "Hide numbers"}
          className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-white/4 border border-white/10 text-secondary/60 hover:text-accent hover:bg-white/10 hover:border-white/15 transition-all duration-200 active:scale-95"
        >
          {isBlurred ? (
            <FiEyeOff strokeWidth={1.5} size={18} />
          ) : (
            <FiEye strokeWidth={1.5} size={18} />
          )}
        </button>
      </motion.div>

      {/* Balance widget — reflects active filters */}
      <TotalBalance
        budgets={filteredBudgets}
        isLoading={isLoadingBudgets && budgets.length === 0}
      />

      {/* Tab Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          type: "spring",
          stiffness: 100,
          damping: 20,
          delay: 0.05,
        }}
        className="flex items-center gap-2 mb-6 border-b border-white/10 pb-2"
      >
        <button
          onClick={() => setActiveTab("transactions")}
          className={`px-4 py-2 font-medium text-sm rounded-lg transition-colors ${
            activeTab === "transactions"
              ? "bg-white/10 text-accent"
              : "text-secondary/60 hover:text-white/80 hover:bg-white/5"
          }`}
        >
          Transactions
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`px-4 py-2 font-medium text-sm rounded-lg transition-colors ${
            activeTab === "analytics"
              ? "bg-white/10 text-accent"
              : "text-secondary/60 hover:text-white/80 hover:bg-white/5"
          }`}
        >
          Analytics
        </button>
      </motion.div>

      {activeTab === "transactions" ? (
        <AnimatePresence mode="popLayout">
          <motion.div
            key="transactions-view"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Controls row */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-3 mb-5">
              <div className="flex-1 min-w-0">
                <FilterBar
                  filterType={filterType}
                  setFilterType={setFilterTypeSmooth}
                  sortBy={sortBy}
                  setSortBy={setSortBySmooth}
                  sortOrder={sortOrder}
                  setSortOrder={setSortOrderSmooth}
                  filterCategory={filterCategory}
                  setFilterCategory={setFilterCategorySmooth}
                  filterMonth={filterMonth}
                  setFilterMonth={setFilterMonthSmooth}
                  filterYear={filterYear}
                  setFilterYear={setFilterYearSmooth}
                  filterRange={filterRange}
                  setFilterRange={setFilterRangeSmooth}
                  search={search}
                  setSearch={setSearch}
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
            </div>

            {/* Section header with grid selector */}
            <div className="flex items-end justify-between mb-4 gap-4">
              <h2 className="font-grotesk text-accent/70 text-sm font-semibold tracking-tight shrink-0 flex items-center gap-2">
                Transactions
                {!isLoadingBudgets && (
                  <span className="text-secondary/35 font-normal tabular-nums">
                    {filteredBudgets.length}
                    {filteredBudgets.length !== budgets.length &&
                      ` of ${budgets.length}`}
                  </span>
                )}
              </h2>

              <div className="flex items-center gap-3">
                {/* Page Size Dropdown */}
                <div className="hidden sm:block w-32">
                  <CustomSelect
                    value={pageSize}
                    onChange={(val) =>
                      setPageSize(val === "all" ? "all" : Number(val))
                    }
                    options={[
                      { value: 25, label: "Show 25" },
                      { value: 50, label: "Show 50" },
                      { value: 75, label: "Show 75" },
                      { value: 100, label: "Show 100" },
                      { value: "all", label: "Show all" },
                    ]}
                    buttonClassName="!bg-[#0a0a0a] !border-white/8 !px-3 !py-1.5 !h-9 !text-xs !text-secondary/60 hover:!text-accent !rounded-lg"
                  />
                </div>

                {/* Grid / List view toggle */}
                <div className="flex items-center gap-0.5 bg-[#0a0a0a] border border-white/8 rounded-lg p-1">
                  {/* Universal Mobile Grid Button (hidden on desktop) */}
                  <button
                    onClick={() =>
                      setGridCols(typeof gridCols === "number" ? gridCols : 3)
                    }
                    title="Grid view"
                    aria-label="Grid view"
                    className={`w-7 h-7 flex sm:hidden items-center justify-center rounded-md transition-all duration-150 ${typeof gridCols === "number" ? "bg-white/8 text-accent" : "text-secondary/35 hover:text-accent"}`}
                  >
                    <FiGrid strokeWidth={1.5} size={13} />
                  </button>

                  {GRID_OPTIONS.map((opt) => {
                    const isDesktopOnly = opt.cols !== "list";
                    return (
                      <button
                        key={opt.cols}
                        onClick={() => setGridCols(opt.cols)}
                        title={opt.label}
                        aria-label={opt.label}
                        className={`w-7 h-7 items-center justify-center rounded-md transition-all duration-150 ${isDesktopOnly ? "hidden sm:flex" : "flex"} ${gridCols === opt.cols ? "bg-white/8 text-accent" : "text-secondary/35 hover:text-accent"}`}
                      >
                        {opt.icon}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Transaction list / grid */}
            <div className={gridClass}>
              {isLoadingBudgets && budgets.length === 0 ? (
                Array.from({ length: gridCols === "list" ? 6 : 8 }).map(
                  (_, i) =>
                    gridCols === "list" ? (
                      <BudgetListRowSkeleton key={`skel-${i}`} />
                    ) : (
                      <BudgetCardSkeleton key={`skel-${i}`} />
                    ),
                )
              ) : filteredBudgets.length === 0 ? (
                <EmptyState key="empty" onAdd={openForm} />
              ) : gridCols === "list" ? (
                visibleBudgets.map((b, i) => (
                  <BudgetListRow
                    key={b._id}
                    budget={b}
                    index={i}
                    onDelete={() => setDeleteItem(b)}
                    onEdit={() => openForm(b)}
                  />
                ))
              ) : (
                visibleBudgets.map((b, i) => (
                  <BudgetCard
                    key={b._id}
                    budget={b}
                    index={i}
                    onDelete={() => setDeleteItem(b)}
                    onEdit={() => openForm(b)}
                  />
                ))
              )}
            </div>

            {/* 'Show More' Button */}
            {!isLoadingBudgets &&
              pageSize !== "all" &&
              visibleCount < filteredBudgets.length && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 flex justify-center"
                >
                  <button
                    onClick={() =>
                      setVisibleCount((prev) =>
                        Math.min(prev + loadStep, filteredBudgets.length),
                      )
                    }
                    disabled={isFilterPending}
                    className="px-6 py-2.5 rounded-full bg-white/4 border border-white/10 text-accent hover:bg-white/10 hover:border-white/20 hover:text-primary transition-all font-medium text-sm w-full sm:w-auto"
                  >
                    Load {loadStep} more
                  </button>
                </motion.div>
              )}
          </motion.div>
        </AnimatePresence>
      ) : (
        <AnimatePresence mode="popLayout">
          <motion.div
            key="analytics-view"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
          >
            <AnalyticsTab budgets={filteredBudgets} />
          </motion.div>
        </AnimatePresence>
      )}

      {/* ── Delete confirmation modal ── */}
      <AnimatePresence>
        {deleteItem && (
          <ModalBackdrop onClose={() => setDeleteItem(null)}>
            <div className="max-w-sm mx-auto">
              <div className="bg-[#080808] border border-white/10 rounded-xl p-6 relative">
                <button
                  onClick={() => setDeleteItem(null)}
                  className="absolute top-4 right-4 w-7 h-7 rounded-md bg-white/4 flex items-center justify-center text-secondary/40 hover:text-accent hover:bg-white/8 transition-all duration-150"
                  aria-label="Close"
                >
                  <FiX strokeWidth={2} className="text-sm" />
                </button>

                <div className="w-10 h-10 rounded-lg bg-red-500/8 border border-red-500/15 flex items-center justify-center mb-4">
                  <FiAlertTriangle
                    className="text-red-400 text-base"
                    strokeWidth={1.5}
                  />
                </div>
                <h3 className="font-grotesk text-accent font-semibold text-base mb-1 tracking-tight">
                  Delete transaction?
                </h3>

                <div className="bg-[#0e0e0e] border border-white/6 rounded-lg p-3 my-4">
                  <p className="text-sm font-medium text-accent wrap-break-word">
                    {deleteItem.title}
                  </p>
                  <p className="text-xs text-secondary/60 mt-1 capitalize">
                    {deleteItem.category} •{" "}
                    {new Date(deleteItem.createdAt).toLocaleDateString("en-IN")}
                  </p>
                  <p
                    className={`text-sm font-bold mt-2 tabular-nums ${deleteItem.type === "income" ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {deleteItem.type === "income" ? "+" : "−"}₹
                    {Number(deleteItem.amount).toLocaleString("en-IN")}
                  </p>
                </div>

                <p className="text-secondary/40 text-sm mb-5">
                  This action cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDeleteItem(null)}
                    className="flex-1 py-2.5 rounded-lg border border-white/8 text-secondary/60 text-sm font-medium hover:text-accent hover:border-white/15 transition-all duration-150 active:scale-[0.98]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(deleteItem)}
                    disabled={deleteMutation.isPending}
                    className="flex-1 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/15 transition-all duration-150 active:scale-[0.98] disabled:opacity-50"
                  >
                    {deleteMutation.isPending ? "Deleting…" : "Delete"}
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
              <button
                onClick={closeForm}
                className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 z-20 w-8 h-8 rounded-lg bg-[#111] border border-white/10 flex items-center justify-center text-secondary/50 hover:text-accent hover:border-white/20 transition-all duration-150 shadow-lg"
                aria-label="Close form"
              >
                <FiX strokeWidth={2} className="text-sm" />
              </button>
              <BudgetForm
                onAdd={(b) => addMutation.mutate(b)}
                onEdit={(b) => editMutation.mutate(b)}
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

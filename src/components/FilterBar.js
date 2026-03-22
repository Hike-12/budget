"use client";
import { FiSliders, FiX, FiArrowUp, FiArrowDown, FiChevronDown, FiSearch } from "react-icons/fi";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CustomSelect from "@/components/CustomSelect";

const categories = ["all", "school friends", "college friends", "religion", "personal", "miscellaneous"];
const ranges = [
  { label: "All",   value: "all"   },
  { label: "Week",  value: "week"  },
  { label: "Month", value: "month" },
  { label: "Year",  value: "year"  },
];

const selectCls =
  "w-full bg-[#0e0e0e] border border-white/8 rounded-lg px-3 py-2 text-accent text-xs font-medium focus:outline-none focus:border-primary/40 transition-all duration-200 cursor-pointer";

export default function FilterBar({
  filterType, setFilterType,
  sortBy, setSortBy,
  sortOrder, setSortOrder,
  filterCategory, setFilterCategory,
  filterMonth, setFilterMonth,
  filterYear, setFilterYear,
  filterRange, setFilterRange,
  search, setSearch,
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const months = ["All", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

  const hasActiveFilters =
    filterType !== "all" || filterCategory !== "all" ||
    filterMonth !== "all" || filterYear !== "all" || filterRange !== "all";

  const clearFilters = () => {
    setFilterType("all");
    setFilterCategory("all");
    setFilterMonth("all");
    setFilterYear("all");
    setFilterRange("all");
    setSearch("");
  };

  const pillBase =
    "px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 border";
  const pillActive =
    "bg-white/8 text-accent border-white/15";
  const pillInactive =
    "text-secondary/50 border-transparent hover:text-accent hover:border-white/8";

  return (
    <div className="mb-2 flex flex-col gap-3 relative z-[20]">
      {/* Search bar */}
      <div className="relative">
        <FiSearch
          strokeWidth={1.5}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary/40 text-sm pointer-events-none"
        />
        <input
          type="text"
          placeholder="Search transactions…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-[#0a0a0a] border border-white/8 rounded-lg pl-9 pr-4 py-2.5 text-accent text-sm placeholder:text-secondary/30 focus:outline-none focus:border-primary/40 transition-all duration-200"
        />
        <AnimatePresence>
          {search && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.12 }}
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary/40 hover:text-accent transition-colors"
              aria-label="Clear search"
            >
              <FiX strokeWidth={2} className="text-sm" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Control strip */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Range pills */}
        <div className="flex items-center gap-0.5 bg-[#0a0a0a] border border-white/8 rounded-lg p-1">
          {ranges.map(r => (
            <button
              key={r.value}
              onClick={() => setFilterRange(r.value)}
              className={`${pillBase} ${filterRange === r.value ? pillActive : pillInactive}`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Type toggle */}
        <div className="flex items-center gap-0.5 bg-[#0a0a0a] border border-white/8 rounded-lg p-1">
          {["all", "income", "expense"].map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`${pillBase} capitalize ${
                filterType === t
                  ? t === "income"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : t === "expense"
                    ? "bg-red-500/10 text-red-400 border-red-500/20"
                    : pillActive
                  : pillInactive
              }`}
            >
              {t === "all" ? "All" : t}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-0.5 bg-[#0a0a0a] border border-white/8 rounded-lg p-1">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="bg-transparent border-none text-accent/70 text-xs font-medium focus:outline-none px-2 py-1 cursor-pointer"
          >
            <option value="createdAt">Date</option>
            <option value="amount">Amount</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="p-1.5 text-secondary/50 hover:text-accent transition-colors rounded-md"
            aria-label="Toggle sort order"
          >
            {sortOrder === "asc"
              ? <FiArrowUp strokeWidth={2} className="text-xs" />
              : <FiArrowDown strokeWidth={2} className="text-xs" />}
          </button>
        </div>

        {/* More filters toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all duration-150 ${
            isExpanded
              ? "bg-white/6 border-white/15 text-accent"
              : "bg-[#0a0a0a] border-white/8 text-secondary/50 hover:text-accent hover:border-white/12"
          }`}
        >
          <FiSliders strokeWidth={1.5} className="text-xs" />
          More
          <motion.span animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.18 }}>
            <FiChevronDown strokeWidth={1.5} className="text-xs" />
          </motion.span>
          {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
        </button>

        {/* Clear */}
        <AnimatePresence>
          {(hasActiveFilters) && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.15 }}
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium bg-white/3 border border-white/8 text-secondary/50 hover:text-accent hover:border-white/12 transition-all duration-150"
            >
              <FiX strokeWidth={2} className="text-xs" />
              Clear
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Expanded advanced filters */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", stiffness: 250, damping: 28 }}
            className="overflow-visible"
          >
            <div className="bg-[#0a0a0a] border border-white/8 rounded-lg p-4 relative z-[30]">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-secondary/40 text-[10px] font-semibold uppercase tracking-widest mb-1.5">Category</label>
                  <CustomSelect 
                    value={filterCategory} 
                    onChange={setFilterCategory} 
                    options={categories.map(c => ({ value: c, label: c === "all" ? "All categories" : c.charAt(0).toUpperCase() + c.slice(1) }))} 
                  />
                </div>
                <div>
                  <label className="block text-secondary/40 text-[10px] font-semibold uppercase tracking-widest mb-1.5">Month</label>
                  <CustomSelect 
                    value={String(filterMonth)} 
                    onChange={setFilterMonth} 
                    options={months.map((m, i) => ({ value: String(i === 0 ? "all" : i), label: m }))} 
                  />
                </div>
                <div>
                  <label className="block text-secondary/40 text-[10px] font-semibold uppercase tracking-widest mb-1.5">Year</label>
                  <CustomSelect 
                    value={String(filterYear)} 
                    onChange={setFilterYear} 
                    options={[ { value: "all", label: "All years" }, ...years.map(y => ({ value: String(y), label: String(y) })) ]} 
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
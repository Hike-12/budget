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
    "px-3 h-7 rounded-md text-xs font-medium transition-all duration-150 border border-transparent flex items-center justify-center underline-offset-4";
  const pillActive =
    "bg-white/10 text-accent font-semibold";
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
          className="w-full h-10 bg-[#0a0a0a] border border-white/8 rounded-lg pl-9 pr-4 py-2 text-accent text-sm placeholder:text-secondary/30 focus:outline-none focus:border-primary/40 transition-all duration-200"
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
        <div className="flex items-center gap-0.5 bg-[#0a0a0a] border border-white/8 rounded-lg p-1 h-9">
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
        <div className="flex items-center gap-0.5 bg-[#0a0a0a] border border-white/8 rounded-lg p-1 h-9">
          {["all", "income", "expense"].map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`${pillBase} capitalize ${
                filterType === t
                  ? t === "income"
                    ? "bg-emerald-500/15 text-emerald-400"
                    : t === "expense"
                    ? "bg-red-500/15 text-red-400"
                    : pillActive
                  : pillInactive
              }`}
            >
              {t === "all" ? "All" : t}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1 bg-[#0a0a0a] border border-white/8 rounded-lg p-1 h-9 min-w-[120px]">
          <CustomSelect
            value={sortBy}
            onChange={setSortBy}
            options={[
              { label: "Date", value: "createdAt" },
              { label: "Amount", value: "amount" }
            ]}
            className="flex-1 !min-w-0"
            buttonClassName="!bg-transparent !border-none !py-0 !px-2 !text-xs !h-full !shadow-none"
          />
          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="w-7 h-7 flex items-center justify-center text-secondary/50 hover:text-accent transition-colors rounded-md border border-white/5 hover:bg-white/5"
            aria-label="Toggle sort order"
          >
            {sortOrder === "asc"
              ? <FiArrowUp strokeWidth={2} className="text-[10px]" />
              : <FiArrowDown strokeWidth={2} className="text-[10px]" />}
          </button>
        </div>

        {/* More filters toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-medium border transition-all duration-150 ${
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
              className="flex items-center gap-1 px-3 h-9 rounded-lg text-xs font-medium bg-white/3 border border-white/8 text-secondary/50 hover:text-accent hover:border-white/12 transition-all duration-150"
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
            <div className="bg-[#0a0a0a]/80 backdrop-blur-3xl border border-white/10 rounded-2xl p-5 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.05)] relative z-[30]">
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
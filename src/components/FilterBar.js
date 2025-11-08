import { FaSortAmountDown, FaSortAmountUp, FaCalendarAlt, FaFilter, FaTimes } from "react-icons/fa";
import { useState } from "react";

const categories = [
  "all",
  "school friends",
  "college friends",
  "religion",
  "personal",
  "miscellaneous",
];

const ranges = [
  { label: "All", value: "all" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "This Year", value: "year" },
];

export default function FilterBar({
  filterType,
  setFilterType,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  filterCategory,
  setFilterCategory,
  filterMonth,
  setFilterMonth,
  filterYear,
  setFilterYear,
  filterRange,
  setFilterRange,
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Generate month/year options
  const months = [
    "All",
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const years = [];
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= currentYear - 5; y--) years.push(y);

  // Check if any filters are active
  const hasActiveFilters = filterType !== "all" || filterCategory !== "all" ||
    filterMonth !== "all" || filterYear !== "all" || filterRange !== "all";

  const clearFilters = () => {
    setFilterType("all");
    setFilterCategory("all");
    setFilterMonth("all");
    setFilterYear("all");
    setFilterRange("all");
  };

  return (
    <div className="mb-6">
      {/* Compact Filter Bar */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Filter Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
            isExpanded || hasActiveFilters
              ? "bg-primary/20 border border-primary/40 text-primary"
              : "bg-dark/50 border border-secondary/30 text-secondary hover:border-secondary/50"
          }`}
        >
          <FaFilter className="text-xs" />
          Filters
          {hasActiveFilters && (
            <span className="bg-primary text-dark rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
              !
            </span>
          )}
        </button>

        {/* Quick Range Selector */}
        <div className="flex items-center gap-1 bg-dark/50 border border-secondary/30 rounded-lg p-1">
          {ranges.map(r => (
            <button
              key={r.value}
              onClick={() => setFilterRange(r.value)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200
                ${filterRange === r.value
                  ? "bg-secondary text-dark shadow border border-secondary"
                  : "text-secondary hover:text-accent bg-transparent border border-transparent"
                }`}
              style={{
                fontWeight: filterRange === r.value ? "600" : "400",
                outline: filterRange === r.value ? "2px solid #739EC9" : "none"
              }}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Sort Control */}
        <div className="flex items-center gap-1 bg-dark/50 border border-secondary/30 rounded-lg p-1">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="bg-transparent border-none text-accent text-xs font-medium focus:outline-none px-2 py-1 cursor-pointer"
          >
            <option value="createdAt">Date</option>
            <option value="amount">Amount</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="p-2 text-secondary hover:text-accent transition-colors duration-200 rounded-md hover:bg-dark/50"
            title="Toggle sort order"
          >
            {sortOrder === "asc" ? <FaSortAmountUp className="text-sm" /> : <FaSortAmountDown className="text-sm" />}
          </button>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all duration-200"
          >
            <FaTimes className="text-xs" />
            Clear
          </button>
        )}
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="mt-3 p-4 bg-dark/30 rounded-lg">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {/* Type Filter */}
            <div>
              <label className="block text-secondary text-xs font-medium mb-1.5 ml-1">
                Type
              </label>
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="w-full bg-dark/50 border border-secondary/30 rounded-lg px-3 py-2 text-accent text-xs focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all cursor-pointer"
              >
                <option value="all">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-secondary text-xs font-medium mb-1.5 ml-1">
                Category
              </label>
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="w-full bg-dark/50 border border-secondary/30 rounded-lg px-3 py-2 text-accent text-xs focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all cursor-pointer"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Month Filter */}
            <div>
              <label className="block text-secondary text-xs font-medium mb-1.5 ml-1">
                Month
              </label>
              <select
                value={filterMonth}
                onChange={e => setFilterMonth(e.target.value)}
                className="w-full bg-dark/50 border border-secondary/30 rounded-lg px-3 py-2 text-accent text-xs focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all cursor-pointer"
              >
                {months.map((m, i) => (
                  <option key={m} value={i === 0 ? "all" : i}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Filter */}
            <div>
              <label className="block text-secondary text-xs font-medium mb-1.5 ml-1">
                Year
              </label>
              <select
                value={filterYear}
                onChange={e => setFilterYear(e.target.value)}
                className="w-full bg-dark/50 border border-secondary/30 rounded-lg px-3 py-2 text-accent text-xs focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all cursor-pointer"
              >
                <option value="all">All Years</option>
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
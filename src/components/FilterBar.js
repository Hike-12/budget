import { FaSortAmountDown, FaSortAmountUp, FaCalendarAlt } from "react-icons/fa";

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
  // Generate month/year options
  const months = [
    "All",
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const years = [];
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= currentYear - 5; y--) years.push(y);

  return (
    <div className="flex flex-wrap gap-2 items-center mb-4">
      <select
        value={filterType}
        onChange={e => setFilterType(e.target.value)}
        className="bg-dark border border-secondary rounded px-3 py-1 text-accent text-sm focus:outline-none"
      >
        <option value="all">All Types</option>
        <option value="income">Income</option>
        <option value="expense">Expense</option>
      </select>
      <select
        value={filterCategory}
        onChange={e => setFilterCategory(e.target.value)}
        className="bg-dark border border-secondary rounded px-3 py-1 text-accent text-sm focus:outline-none"
      >
        {categories.map(cat => (
          <option key={cat} value={cat}>
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </option>
        ))}
      </select>
      <select
        value={filterMonth}
        onChange={e => setFilterMonth(e.target.value)}
        className="bg-dark border border-secondary rounded px-3 py-1 text-accent text-sm focus:outline-none"
      >
        {months.map((m, i) => (
          <option key={m} value={i === 0 ? "all" : i}>
            {m}
          </option>
        ))}
      </select>
      <select
        value={filterYear}
        onChange={e => setFilterYear(e.target.value)}
        className="bg-dark border border-secondary rounded px-3 py-1 text-accent text-sm focus:outline-none"
      >
        <option value="all">All Years</option>
        {years.map(y => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
      <select
        value={filterRange}
        onChange={e => setFilterRange(e.target.value)}
        className="bg-dark border border-secondary rounded px-3 py-1 text-accent text-sm focus:outline-none"
      >
        {ranges.map(r => (
          <option key={r.value} value={r.value}>{r.label}</option>
        ))}
      </select>
      <select
        value={sortBy}
        onChange={e => setSortBy(e.target.value)}
        className="bg-dark border border-secondary rounded px-3 py-1 text-accent text-sm focus:outline-none"
      >
        <option value="createdAt">Date</option>
        <option value="amount">Amount</option>
      </select>
      <button
        onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
        className="bg-dark border border-secondary rounded px-2 py-1 text-accent text-sm flex items-center gap-1"
        title="Toggle sort order"
      >
        {sortOrder === "asc" ? <FaSortAmountUp /> : <FaSortAmountDown />}
        {sortOrder === "asc" ? "Asc" : "Desc"}
      </button>
    </div>
  );
}
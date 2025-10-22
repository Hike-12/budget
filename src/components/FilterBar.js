import { FaSortAmountDown, FaSortAmountUp } from "react-icons/fa";

const categories = [
  "all",
  "school friends",
  "college friends",
  "religion",
  "personal",
  "miscellaneous",
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
}) {
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
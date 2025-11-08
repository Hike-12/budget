"use client";
import { useState, useEffect } from "react";
import { FaPlus, FaSave, FaTimes, FaCalendarAlt, FaTag, FaStickyNote } from "react-icons/fa";

const categories = [
  "school friends",
  "college friends",
  "religion",
  "personal",
  "miscellaneous",
];

export default function BudgetForm({ onAdd, onEdit, editing, setEditing }) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState("miscellaneous");
  const [date, setDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });

  useEffect(() => {
    if (editing) {
      setTitle(editing.title);
      setAmount(editing.amount);
      setType(editing.type);
      setNote(editing.note || "");
      setCategory(editing.category || "miscellaneous");
      setDate(editing.createdAt ? new Date(editing.createdAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
    } else {
      setTitle("");
      setAmount("");
      setType("expense");
      setNote("");
      setCategory("miscellaneous");
      setDate(new Date().toISOString().slice(0, 10));
    }
  }, [editing]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!title || !amount) return;
    const payload = {
      title,
      amount: Number(amount),
      type,
      note,
      category,
      createdAt: new Date(date),
    };
    if (editing) {
      onEdit({ id: editing._id, ...payload });
      setEditing(null);
    } else {
      onAdd(payload);
    }
    setTitle("");
    setAmount("");
    setType("expense");
    setNote("");
    setCategory("miscellaneous");
    setDate(new Date().toISOString().slice(0, 10));
  }

  return (
    <div className="relative">
      {/* Glassmorphic container with gradient border */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 rounded-2xl blur-xl opacity-60"></div>
      
      <div
        className="relative bg-dark/80 backdrop-blur-sm border border-secondary/30 rounded-2xl p-6 shadow-2xl transition-all duration-300 hover:border-secondary/50"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-accent font-semibold text-lg">
            {editing ? "Edit Transaction" : "New Transaction"}
          </h3>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Title Input */}
          <div className="relative group">
            <label className="block text-secondary text-xs font-medium mb-2 ml-1">
              Title
            </label>
            <input
              type="text"
              placeholder="Enter title"
              className="w-full bg-dark/50 border border-secondary/30 rounded-xl px-4 py-3 text-accent text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 placeholder:text-secondary/50"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Amount Input */}
          <div className="relative group">
            <label className="block text-secondary text-xs font-medium mb-2 ml-1">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary">₹</span>
              <input
                type="number"
                placeholder="0.00"
                className="w-full bg-dark/50 border border-secondary/30 rounded-xl pl-8 pr-4 py-3 text-accent text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 placeholder:text-secondary/50"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
                min={0}
              />
            </div>
          </div>

          {/* Type Selector */}
          <div className="relative group">
            <label className="block text-secondary text-xs font-medium mb-2 ml-1">
              Type
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType("expense")}
                className={`flex-1 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                  type === "expense"
                    ? "bg-gradient-to-r from-red-500/20 to-red-600/20 border-2 border-red-500/50 text-red-400"
                    : "bg-dark/50 border border-secondary/30 text-secondary hover:border-secondary/50"
                }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => setType("income")}
                className={`flex-1 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                  type === "income"
                    ? "bg-gradient-to-r from-green-500/20 to-green-600/20 border-2 border-green-500/50 text-green-400"
                    : "bg-dark/50 border border-secondary/30 text-secondary hover:border-secondary/50"
                }`}
              >
                Income
              </button>
            </div>
          </div>

          {/* Category Selector */}
          <div className="relative group">
            <label className="block text-secondary text-xs font-medium mb-2 ml-1 flex items-center gap-1">
              <FaTag className="text-xs" />
              Category
            </label>
            <select
              className="w-full bg-dark/50 border border-secondary/30 rounded-xl px-4 py-3 text-accent text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 appearance-none cursor-pointer"
              value={category}
              onChange={e => setCategory(e.target.value)}
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.75rem center',
                backgroundSize: '1.25rem'
              }}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Date Input */}
          <div className="relative group">
            <label className="block text-secondary text-xs font-medium mb-2 ml-1 flex items-center gap-1">
              <FaCalendarAlt className="text-xs" />
              Date
            </label>
            <input
              type="date"
              className="w-full bg-dark/50 border border-secondary/30 rounded-xl px-4 py-3 text-accent text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
            />
          </div>

          {/* Note Input - Full Width */}
          <div className="relative group md:col-span-2">
            <label className="block text-secondary text-xs font-medium mb-2 ml-1 flex items-center gap-1">
              <FaStickyNote className="text-xs" />
              Note (Optional)
            </label>
            <textarea
              placeholder="Add a note..."
              className="w-full bg-dark/50 border border-secondary/30 rounded-xl px-4 py-3 text-accent text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 placeholder:text-secondary/50 resize-none"
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="button"
          onClick={handleSubmit}
          className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg ${
            editing
              ? "bg-gradient-to-r from-primary to-primary/80 text-dark hover:shadow-primary/50"
              : "bg-gradient-to-r from-secondary to-secondary/80 text-dark hover:shadow-secondary/50"
          }`}
        >
          {editing ? <FaSave className="text-base" /> : <FaPlus className="text-base" />}
          {editing ? "Save Changes" : "Add Transaction"}
        </button>
      </div>
    </div>
  );
}
"use client";
import { useState, useEffect } from "react";
import { FaPlus, FaSave, FaTimes } from "react-icons/fa";
import { motion } from "framer-motion";

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

  useEffect(() => {
    if (editing) {
      setTitle(editing.title);
      setAmount(editing.amount);
      setType(editing.type);
      setNote(editing.note || "");
      setCategory(editing.category || "miscellaneous");
    } else {
      setTitle("");
      setAmount("");
      setType("expense");
      setNote("");
      setCategory("miscellaneous");
    }
  }, [editing]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!title || !amount) return;
    const payload = { title, amount: Number(amount), type, note, category };
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
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row gap-2 items-center mb-2"
    >
      <input
        type="text"
        placeholder="Title"
        className="bg-dark border border-secondary rounded px-3 py-1 text-accent text-sm focus:outline-none"
        value={title}
        onChange={e => setTitle(e.target.value)}
        required
      />
      <input
        type="number"
        placeholder="Amount"
        className="bg-dark border border-secondary rounded px-3 py-1 text-accent text-sm focus:outline-none"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        required
        min={0}
      />
      <select
        className="bg-dark border border-secondary rounded px-3 py-1 text-accent text-sm focus:outline-none"
        value={type}
        onChange={e => setType(e.target.value)}
      >
        <option value="expense">Expense</option>
        <option value="income">Income</option>
      </select>
      <select
        className="bg-dark border border-secondary rounded px-3 py-1 text-accent text-sm focus:outline-none"
        value={category}
        onChange={e => setCategory(e.target.value)}
      >
        {categories.map(cat => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Note"
        className="bg-dark border border-secondary rounded px-3 py-1 text-accent text-sm focus:outline-none"
        value={note}
        onChange={e => setNote(e.target.value)}
      />
      <button
        type="submit"
        className={`flex items-center gap-1 px-3 py-1 rounded font-medium text-sm transition ${
          editing
            ? "bg-primary text-dark hover:bg-secondary"
            : "bg-secondary text-dark hover:bg-primary"
        }`}
      >
        {editing ? <FaSave /> : <FaPlus />}
        {editing ? "Save" : "Add"}
      </button>
      {editing && (
        <button
          type="button"
          onClick={() => setEditing(null)}
          className="px-2 py-1 rounded bg-dark border border-secondary text-secondary text-xs hover:text-accent transition"
          title="Cancel edit"
        >
          <FaTimes />
        </button>
      )}
    </motion.form>
  );
}
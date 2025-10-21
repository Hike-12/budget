"use client";
import { useState } from "react";
import { FaPlus } from "react-icons/fa";
import { motion } from "framer-motion";

export default function BudgetForm({ onAdd }) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");
  const [note, setNote] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!title || !amount) return;
    onAdd({ title, amount: Number(amount), type, note });
    setTitle("");
    setAmount("");
    setNote("");
    setType("expense");
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row gap-4 items-center"
    >
      <input
        type="text"
        placeholder="Title"
        className="bg-dark border border-secondary rounded px-4 py-2 text-accent focus:outline-none focus:border-primary"
        value={title}
        onChange={e => setTitle(e.target.value)}
        required
      />
      <input
        type="number"
        placeholder="Amount"
        className="bg-dark border border-secondary rounded px-4 py-2 text-accent focus:outline-none focus:border-primary"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        required
        min={0}
      />
      <select
        className="bg-dark border border-secondary rounded px-4 py-2 text-accent focus:outline-none focus:border-primary"
        value={type}
        onChange={e => setType(e.target.value)}
      >
        <option value="expense">Expense</option>
        <option value="income">Income</option>
      </select>
      <input
        type="text"
        placeholder="Note (optional)"
        className="bg-dark border border-secondary rounded px-4 py-2 text-accent focus:outline-none focus:border-primary"
        value={note}
        onChange={e => setNote(e.target.value)}
      />
      <button
        type="submit"
        className="bg-primary text-dark rounded px-4 py-2 flex items-center gap-2 font-bold hover:bg-secondary transition"
      >
        <FaPlus />
        Add
      </button>
    </motion.form>
  );
}
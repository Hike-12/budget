"use client";
import { useState, useEffect } from "react";
import { FiPlus, FiSave, FiTag, FiFileText, FiAlignLeft, FiHash } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import CustomSelect from "@/components/CustomSelect";
import CustomDatePicker from "@/components/CustomDatePicker";

const categories = [
  "school friends",
  "college friends",
  "religion",
  "personal",
  "miscellaneous",
];

const inputCls =
  "w-full bg-[#0e0e0e] border border-white/8 rounded-lg px-4 py-2.5 text-accent text-sm focus:outline-none focus:border-primary/40 transition-all duration-200 placeholder:text-secondary/25";

export default function BudgetForm({ onAdd, onEdit, editing, setEditing }) {
  const [title,    setTitle]    = useState("");
  const [amount,   setAmount]   = useState("");
  const [type,     setType]     = useState("expense");
  const [note,     setNote]     = useState("");
  const [category, setCategory] = useState("miscellaneous");
  const [date,     setDate]     = useState(() => new Date().toISOString().slice(0, 10));
  const [errors,   setErrors]   = useState({});

  useEffect(() => {
    if (editing) {
      setTitle(editing.title);
      setAmount(editing.amount);
      setType(editing.type);
      setNote(editing.note || "");
      setCategory(editing.category || "miscellaneous");
      setDate(editing.createdAt
        ? new Date(editing.createdAt).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10));
    } else {
      setTitle(""); setAmount(""); setType("expense");
      setNote(""); setCategory("miscellaneous");
      setDate(new Date().toISOString().slice(0, 10));
    }
    setErrors({});
  }, [editing]);

  function validate() {
    const e = {};
    if (!title.trim())           e.title  = "Title is required";
    if (!amount || Number(amount) <= 0) e.amount = "Enter a valid amount";
    return e;
  }

  function handleSubmit(evt) {
    evt.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    const payload = { title: title.trim(), amount: Number(amount), type, note, category, createdAt: new Date(date) };
    if (editing) { onEdit({ id: editing._id, ...payload }); setEditing(null); }
    else onAdd(payload);
    setTitle(""); setAmount(""); setType("expense"); setNote(""); setCategory("miscellaneous");
    setDate(new Date().toISOString().slice(0, 10));
    setErrors({});
  }

  return (
    <div className="bg-[#080808] border border-white/10 rounded-xl p-5 sm:p-7 md:p-8">
      {/* Header */}
      <h3 className="font-grotesk text-accent font-semibold text-lg tracking-tight mb-5 sm:mb-6">
        {editing ? "Edit transaction" : "New transaction"}
      </h3>

      <form onSubmit={handleSubmit} noValidate>
        {/* Type toggle */}
        <div className="flex gap-1.5 mb-5 p-1 bg-white/3 border border-white/8 rounded-lg">
          <button
            type="button"
            onClick={() => setType("expense")}
            className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
              type === "expense"
                ? "bg-red-500/12 text-red-400 border border-red-500/20"
                : "text-secondary/40 hover:text-accent border border-transparent"
            }`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => setType("income")}
            className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
              type === "income"
                ? "bg-emerald-500/12 text-emerald-400 border border-emerald-500/20"
                : "text-secondary/40 hover:text-accent border border-transparent"
            }`}
          >
            Income
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-5 sm:mb-6">
          {/* Title */}
          <div>
            <label className="flex items-center gap-1.5 text-secondary/40 text-[10px] font-semibold uppercase tracking-widest mb-1.5">
              <FiAlignLeft strokeWidth={2} className="text-[10px]" /> Title
            </label>
            <input
              type="text"
              placeholder="e.g. Chai with friends"
              className={`${inputCls} ${errors.title ? "border-red-500/40" : ""}`}
              value={title}
              onChange={e => { setTitle(e.target.value); errors.title && setErrors(p => ({ ...p, title: null })); }}
            />
            <AnimatePresence>
              {errors.title && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-red-400/80 text-xs mt-1 ml-0.5">{errors.title}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Amount */}
          <div>
            <label className="flex items-center gap-1.5 text-secondary/40 text-[10px] font-semibold uppercase tracking-widest mb-1.5">
              <FiHash strokeWidth={2} className="text-[10px]" /> Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/30 text-sm pointer-events-none">₹</span>
              <input
                type="number"
                placeholder="0"
                className={`${inputCls} pl-8 tabular-nums ${errors.amount ? "border-red-500/40" : ""}`}
                value={amount}
                onChange={e => { setAmount(e.target.value); errors.amount && setErrors(p => ({ ...p, amount: null })); }}
                min="0" step="0.01"
              />
            </div>
            <AnimatePresence>
              {errors.amount && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-red-400/80 text-xs mt-1 ml-0.5">{errors.amount}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Category */}
          <div>
            <label className="flex items-center gap-1.5 text-secondary/40 text-[10px] font-semibold uppercase tracking-widest mb-1.5">
              <FiTag strokeWidth={2} className="text-[10px]" /> Category
            </label>
            <CustomSelect
              value={category}
              onChange={setCategory}
              options={categories.map(c => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) }))}
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-secondary/40 text-[10px] font-semibold uppercase tracking-widest mb-1.5">Date</label>
            <CustomDatePicker
              value={date}
              onChange={setDate}
            />
          </div>

          {/* Note */}
          <div className="sm:col-span-2">
            <label className="flex items-center gap-1.5 text-secondary/40 text-[10px] font-semibold uppercase tracking-widest mb-1.5">
              <FiFileText strokeWidth={2} className="text-[10px]" /> Note
              <span className="text-white/15 normal-case tracking-normal font-normal">(optional)</span>
            </label>
            <textarea
              placeholder="Add context…"
              className={`${inputCls} resize-none`}
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full py-3 rounded-lg bg-primary text-dark font-semibold text-sm hover:bg-secondary transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {editing ? <FiSave strokeWidth={2} /> : <FiPlus strokeWidth={2.5} />}
          {editing ? "Save changes" : "Add transaction"}
        </button>
      </form>
    </div>
  );
}
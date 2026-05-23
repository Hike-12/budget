"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  FiPlus,
  FiSave,
  FiTag,
  FiFileText,
  FiAlignLeft,
  FiHash,
} from "react-icons/fi";
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

function calcPreview(expr) {
  if (!expr || !/[+\-*/]/.test(expr)) return null;
  const sanitized = expr.replace(/[^0-9.+\-*/]/g, "").trim();
  if (!sanitized) return null;
  try {
    const result = Function(`"use strict"; return (${sanitized})`)();
    if (typeof result === "number" && isFinite(result)) {
      return Math.round(result * 100) / 100;
    }
    return null;
  } catch {
    return null;
  }
}

const defaultState = (editing) => ({
  title: editing?.title ?? "",
  amount: editing?.amount ?? "",
  type: editing?.type ?? "expense",
  note: editing?.note ?? "",
  category: editing?.category ?? "miscellaneous",
  clientId: editing?.clientId ?? editing?._id ?? null,
  date: editing?.createdAt
    ? new Date(editing.createdAt).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10),
});

export default function BudgetForm({ onAdd, onEdit, editing, setEditing }) {
  const [form, setForm] = useState(() => defaultState(editing));
  const [errors, setErrors] = useState({});
  const [calcExpr, setCalcExpr] = useState(null);
  const [calcResult, setCalcResult] = useState(null);
  const calcTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (calcTimeoutRef.current) clearTimeout(calcTimeoutRef.current);
    };
  }, []);

  // Re-seed when editing target switches  (useEffect is correct here — it's
  // a genuine synchronisation with an external prop change, not derivable synchronously)
  useEffect(() => {
    setForm(defaultState(editing));
    setErrors({});
  }, [editing]);

  const set = useCallback(
    (field) => (value) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => ({ ...prev, [field]: null }));
    },
    [],
  );

  const handleAmountChange = useCallback(
    (e) => {
      const value = e.target.value;
      set("amount")(value);
      if (calcTimeoutRef.current) clearTimeout(calcTimeoutRef.current);
      if (value && /[+\-*/]/.test(value)) {
        const result = calcPreview(value);
        if (result !== null) {
          setCalcExpr(value);
          setCalcResult(result);
          calcTimeoutRef.current = setTimeout(() => {
            setForm((prev) => ({ ...prev, amount: String(result) }));
          }, 300);
          return;
        }
      }
      setCalcExpr(null);
      setCalcResult(null);
    },
    [set],
  );

  const handleAmountBlur = useCallback(() => {
    if (calcTimeoutRef.current) clearTimeout(calcTimeoutRef.current);
    const val = form.amount;
    if (val && /[+\-*/]/.test(val)) {
      const result = calcPreview(val);
      if (result !== null) {
        setForm((prev) => ({ ...prev, amount: String(result) }));
      }
    }
  }, [form.amount]);

  const validate = useCallback(() => {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required";
    const amountNum = Number(form.amount);
    if (!form.amount || isNaN(amountNum) || amountNum <= 0)
      e.amount = "Enter a valid amount";
    return e;
  }, [form.title, form.amount]);

  const handleSubmit = useCallback(
    (evt) => {
      evt.preventDefault();

      let resolvedAmount = form.amount;
      if (resolvedAmount && /[+\-*/]/.test(resolvedAmount)) {
        const evaled = calcPreview(resolvedAmount);
        if (evaled !== null) {
          resolvedAmount = String(evaled);
          setForm((prev) => ({ ...prev, amount: resolvedAmount }));
          setCalcExpr(null);
          setCalcResult(null);
        }
      }

      const e = validate();
      if (Object.keys(e).length) {
        setErrors(e);
        return;
      }
      const payload = {
        title: form.title.trim(),
        amount: Number(resolvedAmount),
        type: form.type,
        note: form.note,
        category: form.category,
        clientId: form.clientId,
        createdAt: new Date(form.date),
        updatedAt: new Date(),
      };
      if (editing) {
        onEdit({ id: editing._id, ...payload });
        setEditing(null);
      } else {
        onAdd(payload);
      }
      setForm(defaultState(null));
      setErrors({});
    },
    [form, editing, validate, onAdd, onEdit, setEditing],
  );

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
            onClick={() => set("type")("expense")}
            className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
              form.type === "expense"
                ? "bg-red-500/12 text-red-400 border border-red-500/20"
                : "text-secondary/40 hover:text-accent border border-transparent"
            }`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => set("type")("income")}
            className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
              form.type === "income"
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
              value={form.title}
              onChange={(e) => set("title")(e.target.value)}
            />
            <AnimatePresence>
              {errors.title && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-red-400/80 text-xs mt-1 ml-0.5"
                >
                  {errors.title}
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
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/30 text-sm pointer-events-none">
                ₹
              </span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0"
                className={`${inputCls} pl-8 tabular-nums ${errors.amount ? "border-red-500/40" : ""}`}
                value={form.amount}
                onChange={handleAmountChange}
                onBlur={handleAmountBlur}
              />
            </div>
            <div className="h-5 m-1.5 flex items-center">
              {calcExpr !== null && (
                <p className="text-primary/80 text-xs font-semibold">
                  {calcExpr} = {calcResult}
                </p>
              )}
            </div>
            <AnimatePresence>
              {errors.amount && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-red-400/80 text-xs mt-1 ml-0.5"
                >
                  {errors.amount}
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
              value={form.category}
              onChange={set("category")}
              options={categories.map((c) => ({
                value: c,
                label: c.charAt(0).toUpperCase() + c.slice(1),
              }))}
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-secondary/40 text-[10px] font-semibold uppercase tracking-widest mb-1.5">
              Date
            </label>
            <CustomDatePicker value={form.date} onChange={set("date")} />
          </div>

          {/* Note */}
          <div className="sm:col-span-2">
            <label className="flex items-center gap-1.5 text-secondary/40 text-[10px] font-semibold uppercase tracking-widest mb-1.5">
              <FiFileText strokeWidth={2} className="text-[10px]" /> Note
              <span className="text-white/15 normal-case tracking-normal font-normal">
                (optional)
              </span>
            </label>
            <textarea
              placeholder="Add context…"
              className={`${inputCls} resize-none`}
              value={form.note}
              onChange={(e) => set("note")(e.target.value)}
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

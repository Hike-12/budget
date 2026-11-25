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
import { MAIN_TRANSACTION_CATEGORIES } from "@/lib/transactionCategories";

const categories = [...MAIN_TRANSACTION_CATEGORIES, "Investment"];

const inputCls =
  "w-full bg-[#0e0e0e] border border-white/8 rounded-lg px-4 py-2.5 text-[var(--color-accent)] text-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors placeholder:text-white/35";
const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const weekdayOrder = [1, 2, 3, 4, 5, 6, 0];

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

const defaultState = (editing, today) => ({
  title: editing?.title ?? "",
  amount: editing?.amount ?? "",
  type: editing?.type ?? "expense",
  note: editing?.note ?? "",
  category: editing?.category ?? "miscellaneous",
  clientId: editing?.clientId ?? editing?._id ?? null,
  date:
    editing?.startDate ||
    (editing?.createdAt
      ? new Date(editing.createdAt).toISOString().slice(0, 10)
      : today || new Date().toISOString().slice(0, 10)),
  weekdays: editing?.weekdays ?? [],
});

export default function BudgetForm({
  onAdd,
  onEdit,
  editing,
  setEditing,
  setup,
}) {
  const today = setup?.today;
  const recurring = setup?.kind === "recurring";
  const [form, setForm] = useState(() => defaultState(editing, today));
  const [errors, setErrors] = useState({});
  const [calcExpr, setCalcExpr] = useState(null);
  const [calcResult, setCalcResult] = useState(null);
  const [convertedFrom, setConvertedFrom] = useState(null);
  const [convertedTo, setConvertedTo] = useState(null);
  const calcTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (calcTimeoutRef.current) clearTimeout(calcTimeoutRef.current);
    };
  }, []);

  // Re-seed when editing target switches  (useEffect is correct here — it's
  // a genuine synchronisation with an external prop change, not derivable synchronously)
  useEffect(() => {
    setForm(defaultState(editing, today));
    setErrors({});
  }, [editing, today]);

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

      let displayExpr = value;
      if (convertedFrom && convertedTo && value.startsWith(convertedTo)) {
        const rest = value.slice(convertedTo.length);
        if (rest && /^[+\-*/]/.test(rest)) {
          displayExpr = convertedFrom + rest;
        } else {
          setConvertedFrom(null);
          setConvertedTo(null);
        }
      } else if (convertedFrom) {
        setConvertedFrom(null);
        setConvertedTo(null);
      }

      if (value && /[+\-*/]/.test(value)) {
        if (/[+\-*/]$/.test(value)) return;

        const result = calcPreview(displayExpr);
        if (result !== null) {
          setCalcExpr(displayExpr);
          setCalcResult(result);
          calcTimeoutRef.current = setTimeout(() => {
            setForm((prev) => ({ ...prev, amount: String(result) }));
            setConvertedFrom(displayExpr);
            setConvertedTo(String(result));
          }, 300);
          return;
        }
      }
      setCalcExpr(null);
      setCalcResult(null);
    },
    [set, convertedFrom, convertedTo],
  );

  const handleAmountBlur = useCallback(() => {
    if (calcTimeoutRef.current) clearTimeout(calcTimeoutRef.current);
    const src = calcExpr || form.amount;
    if (src && /[+\-*/]/.test(src)) {
      const result = calcPreview(src);
      if (result !== null) {
        setForm((prev) => ({ ...prev, amount: String(result) }));
        setConvertedFrom(src);
        setConvertedTo(String(result));
      }
    }
  }, [form.amount, calcExpr]);

  const validate = useCallback(
    (resolvedAmount) => {
      const e = {};
      if (!form.title.trim()) e.title = "Title is required";
      const amountNum = Number(resolvedAmount);
      if (
        !resolvedAmount ||
        !Number.isFinite(amountNum) ||
        amountNum <= 0 ||
        (setup && amountNum > 1e9)
      )
        e.amount = "Enter a valid amount";
      if (recurring && !form.weekdays.length)
        e.weekdays = "Choose at least one day.";
      return e;
    },
    [form.title, form.weekdays, recurring, setup],
  );

  const handleSubmit = useCallback(
    (evt) => {
      evt.preventDefault();
      if (setup?.busy) return;

      let resolvedAmount = form.amount;
      if (resolvedAmount && /[+\-*/]/.test(resolvedAmount)) {
        const evaled = calcPreview(resolvedAmount);
        if (evaled !== null) {
          resolvedAmount = String(evaled);
          setForm((prev) => ({ ...prev, amount: resolvedAmount }));
          setCalcExpr(null);
          setCalcResult(null);
          setConvertedFrom(null);
          setConvertedTo(null);
        }
      }

      const e = validate(resolvedAmount);
      if (Object.keys(e).length) {
        setErrors(e);
        return;
      }
      if (setup) {
        setup.onSave({
          kind: setup.kind,
          title: form.title.trim(),
          amount: Number(resolvedAmount),
          type: form.type,
          note: form.note.trim(),
          category: form.category,
          ...(recurring && {
            weekdays: form.weekdays,
            startDate: form.date,
            paused: editing?.paused ?? false,
          }),
        });
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
    [form, editing, validate, onAdd, onEdit, setEditing, setup, recurring],
  );

  const categoryOptions = (
    setup ? MAIN_TRANSACTION_CATEGORIES : categories
  ).map((category) => ({
    value: category,
    label: category.charAt(0).toUpperCase() + category.slice(1),
  }));
  if (!categoryOptions.some(({ value }) => value === form.category)) {
    categoryOptions.unshift({
      value: form.category,
      label: form.category,
      disabled: true,
    });
  }

  return (
    <div className="bg-[#080808] border border-white/10 rounded-xl p-5 sm:p-7 md:p-8">
      {/* Header */}
      <h3
        id="transaction-form-title"
        className="pr-10 font-grotesk text-[var(--color-accent)] font-semibold text-lg tracking-tight mb-5 sm:mb-6"
      >
        {setup?.title ?? (editing ? "Edit transaction" : "New transaction")}
      </h3>

      <form onSubmit={handleSubmit} noValidate>
        {/* Type toggle */}
        <div className="flex gap-1.5 mb-5 p-1 bg-white/3 border border-white/8 rounded-lg">
          <button
            type="button"
            aria-pressed={form.type === "expense"}
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
            aria-pressed={form.type === "income"}
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
              aria-label="Title"
              maxLength={setup ? 80 : undefined}
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
                aria-label="Amount"
                placeholder="0"
                className={`${inputCls} pl-8 tabular-nums ${errors.amount ? "border-red-500/40" : ""}`}
                value={form.amount}
                onChange={handleAmountChange}
                onBlur={handleAmountBlur}
              />
            </div>
            {calcExpr !== null && (
              <div className="h-5 m-1.5 flex items-center">
                <p className="text-primary/80 text-xs font-semibold">
                  {calcExpr} = {calcResult}
                </p>
              </div>
            )}
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
              aria-label="Category"
              options={categoryOptions}
            />
          </div>

          {/* Date */}
          {(!setup || recurring) && (
            <div>
              <label className="block text-secondary/40 text-[10px] font-semibold uppercase tracking-widest mb-1.5">
                {recurring ? "Start date" : "Date"}
              </label>
              <CustomDatePicker
                value={form.date}
                onChange={set("date")}
                aria-label={recurring ? "Start date" : "Date"}
                min={
                  recurring
                    ? editing?.startDate < today
                      ? editing.startDate
                      : today
                    : undefined
                }
                max={recurring ? "2100-12-31" : undefined}
              />
            </div>
          )}

          {recurring && (
            <fieldset className="sm:col-span-2">
              <legend className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-secondary)]">
                Repeat on
              </legend>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                {weekdayOrder.map((day) => {
                  const selected = form.weekdays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      aria-pressed={selected}
                      className={`min-h-10 rounded-lg border text-sm font-semibold ${selected ? "border-[var(--color-primary)] bg-[#25384b]" : "border-white/10 hover:bg-white/8"}`}
                      onClick={() =>
                        set("weekdays")(
                          selected
                            ? form.weekdays.filter((value) => value !== day)
                            : [...form.weekdays, day],
                        )
                      }
                    >
                      {weekdayLabels[day]}
                    </button>
                  );
                })}
              </div>
              {errors.weekdays && (
                <p className="mt-2 text-xs text-red-400">{errors.weekdays}</p>
              )}
            </fieldset>
          )}

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
              aria-label="Note"
              maxLength={setup ? 500 : undefined}
              className={`${inputCls} resize-none`}
              value={form.note}
              onChange={(e) => set("note")(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        {/* Submit */}
        {setup?.error && (
          <p role="alert" className="mb-3 text-sm text-red-400">
            {setup.error}
          </p>
        )}
        <button
          type="submit"
          disabled={setup?.busy}
          className="w-full py-3 rounded-lg bg-[var(--color-primary)] text-black font-semibold text-sm hover:bg-[var(--color-secondary)] transition-colors flex items-center justify-center gap-2 disabled:opacity-55"
        >
          {editing || setup ? (
            <FiSave strokeWidth={2} />
          ) : (
            <FiPlus strokeWidth={2.5} />
          )}
          {setup?.busy
            ? "Saving…"
            : (setup?.submitLabel ??
              (editing ? "Save changes" : "Add transaction"))}
        </button>
      </form>
    </div>
  );
}

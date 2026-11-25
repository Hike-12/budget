"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { FiArrowLeft, FiCalendar, FiPlus, FiZap } from "react-icons/fi";

const days = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const order = [1, 2, 3, 4, 5, 6, 0];
const categories = [
  "miscellaneous",
  "personal",
  "Transport",
  "Food",
  "Travel",
  "Shopping",
  "Bills",
  "Entertainment",
  "Health",
  "school friends",
  "college friends",
  "religion",
  "Other",
];
const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});
const dateLabel = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeZone: "UTC",
});
const card = "rounded-2xl border border-white/10 bg-[#101010]";
const primary =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-bold text-[var(--color-dark)] hover:bg-[var(--color-secondary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-secondary)] disabled:opacity-50";
const secondary =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-[var(--color-accent)] hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-[var(--color-secondary)] disabled:opacity-50";
const field =
  "w-full rounded-lg border border-white/15 bg-[#0e0e0e] px-3 py-2.5 text-[var(--color-accent)] [color-scheme:dark] focus-visible:outline-2 focus-visible:outline-[var(--color-secondary)]";

async function request(kind, body, signal) {
  const response = await fetch(`/api/transaction-rules?kind=${kind}`, {
    signal,
    ...(body && {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  });
  const data = await response.json();
  if (!response.ok)
    throw Object.assign(new Error(data.error), { status: response.status });
  return data;
}

function RuleEditor({ initial, kind, today, onCancel, onSave, busy }) {
  const recurring = kind === "recurring";
  const [form, setForm] = useState(() =>
    initial
      ? { ...initial, amount: String(initial.amount) }
      : {
          title: "",
          amount: "",
          type: "expense",
          category: "miscellaneous",
          note: "",
          ...(recurring && { weekdays: [], startDate: today, paused: false }),
        },
  );
  const change = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));
  function submit(event) {
    event.preventDefault();
    if (!form.title.trim() || (recurring && !form.weekdays.length)) return;
    onSave({ ...form, kind, amount: Number(form.amount) });
  }
  return (
    <form onSubmit={submit} className={`${card} space-y-5 p-4 sm:p-6`}>
      <div className="grid gap-4 min-[360px]:grid-cols-[minmax(0,1fr)_7rem] sm:grid-cols-[minmax(0,1fr)_9rem]">
        <label className="grid gap-2 text-sm font-semibold text-[var(--color-accent)]">
          Name
          <input
            className={field}
            autoFocus
            required
            maxLength={80}
            value={form.title}
            placeholder="Rickshaw"
            onChange={(e) => change("title", e.target.value)}
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-[var(--color-accent)]">
          Amount (₹)
          <input
            className={field}
            required
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            max="1000000000"
            value={form.amount}
            onChange={(e) => change("amount", e.target.value)}
          />
        </label>
      </div>
      <div className="grid gap-4 min-[360px]:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-[var(--color-accent)]">
          Type
          <select
            className={field}
            value={form.type}
            onChange={(e) => change("type", e.target.value)}
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-[var(--color-accent)]">
          Category
          <select
            className={`${field} capitalize`}
            value={form.category}
            onChange={(e) => change("category", e.target.value)}
          >
            {categories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </label>
      </div>
      {recurring && (
        <>
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-[var(--color-accent)]">
              Repeat on
            </legend>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
              {order.map((day) => {
                const selected = form.weekdays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    aria-label={days[day]}
                    aria-pressed={selected}
                    className={`min-h-11 rounded-lg border text-sm font-semibold focus-visible:outline-2 focus-visible:outline-[var(--color-secondary)] ${selected ? "border-[var(--color-primary)] bg-[#25384b] text-[var(--color-accent)]" : "border-white/10 text-[var(--color-secondary)] hover:bg-white/5"}`}
                    onClick={() =>
                      change(
                        "weekdays",
                        selected
                          ? form.weekdays.filter((value) => value !== day)
                          : [...form.weekdays, day],
                      )
                    }
                  >
                    {days[day].slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <label className="grid gap-2 text-sm font-semibold text-[var(--color-accent)] sm:max-w-xs">
            Start date
            <input
              className={field}
              required
              type="date"
              min={initial?.startDate < today ? initial.startDate : today}
              max="2100-12-31"
              value={form.startDate}
              onChange={(e) => change("startDate", e.target.value)}
            />
          </label>
        </>
      )}
      <label className="grid gap-2 text-sm font-semibold text-[var(--color-accent)]">
        Note <span className="sr-only">(optional)</span>
        <textarea
          rows={2}
          className={field}
          maxLength={500}
          placeholder="Optional"
          value={form.note}
          onChange={(e) => change("note", e.target.value)}
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          className={primary}
          type="submit"
          disabled={
            busy || !form.title.trim() || (recurring && !form.weekdays.length)
          }
        >
          {busy ? "Saving…" : "Save"}
        </button>
        <button
          className={secondary}
          type="button"
          onClick={onCancel}
          disabled={busy}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function TransactionRulesPage({ kind }) {
  const recurring = kind === "recurring";
  const title = recurring ? "Recurring transactions" : "Quick transactions";
  const newLabel = recurring ? "New schedule" : "New quick transaction";
  const Icon = recurring ? FiCalendar : FiZap;
  const [data, setData] = useState(null);
  const [editor, setEditor] = useState(null);
  const [remove, setRemove] = useState(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState(null);
  const [active, setActive] = useState(null);
  const [reload, setReload] = useState(0);
  const inFlight = useRef(false);
  const requestIds = useRef({});
  const queryClient = useQueryClient();

  useEffect(() => {
    const controller = new AbortController();
    request(kind, null, controller.signal)
      .then(setData)
      .catch((err) => {
        if (!controller.signal.aborted) setError(err);
      });
    return () => controller.abort();
  }, [kind, reload]);

  async function act(id, body, success) {
    if (inFlight.current) return;
    inFlight.current = true;
    setActive(id);
    setNotice("");
    setError(null);
    try {
      const result = await request(kind, body);
      success(result);
      await queryClient.invalidateQueries({ queryKey: ["budgets"] });
    } catch (err) {
      setError(err);
      if (err.status === 409) setReload((value) => value + 1);
    } finally {
      inFlight.current = false;
      setActive(null);
    }
  }

  function save(rule, id) {
    const requestId = id
      ? undefined
      : (requestIds.current.new ??= crypto.randomUUID());
    act(
      id || "new",
      { action: "save", id, rule, requestId },
      ({ rule: saved }) => {
        if (!id) delete requestIds.current.new;
        setData((current) => ({
          ...current,
          rules: id
            ? current.rules.map((item) => (item._id === id ? saved : item))
            : [...current.rules, saved],
        }));
        setEditor(null);
        setNotice(
          id
            ? "Changes saved."
            : recurring
              ? "Schedule saved."
              : "Quick transaction saved.",
        );
      },
    );
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-3xl px-4 pb-28 pt-28 sm:px-8">
      <Link
        href={recurring ? "/settings" : "/dashboard"}
        className="mb-6 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[var(--color-secondary)] hover:text-[var(--color-accent)]"
      >
        <FiArrowLeft /> {recurring ? "Settings" : "Dashboard"}
      </Link>
      <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-grotesk text-3xl font-bold tracking-tight text-[var(--color-accent)] sm:text-4xl">
            {title}
          </h1>
          <p className="mt-2 text-sm text-[var(--color-secondary)]">
            {recurring
              ? "Log transactions automatically on the weekdays you choose. Dates use India time."
              : "Save the details once, then add the transaction in one tap."}
          </p>
        </div>
        {!!data && !editor && !!data.rules.length && (
          <button
            className={primary}
            onClick={() => {
              setEditor({});
              setRemove(null);
              setNotice("");
            }}
          >
            <FiPlus />
            {newLabel}
          </button>
        )}
      </header>
      <p
        role="status"
        className={
          notice ? "mb-4 text-sm text-[var(--color-secondary)]" : "sr-only"
        }
      >
        {notice}
      </p>
      {error && (
        <div
          role="alert"
          className={`${card} mb-4 flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm text-[var(--color-accent)]`}
        >
          <span>
            {error.status === 401
              ? "Sign in again to sync your saved transactions."
              : error.message || "Could not load transactions."}
          </span>
          {error.status === 401 ? (
            <Link className={secondary} href="/login?reauth=1">
              Sign in
            </Link>
          ) : (
            !data && (
              <button
                className={secondary}
                onClick={() => {
                  setError(null);
                  setReload(reload + 1);
                }}
              >
                Retry
              </button>
            )
          )}
        </div>
      )}
      {!data && !error && (
        <p role="status" className="text-sm text-[var(--color-secondary)]">
          Loading…
        </p>
      )}
      {editor && data && (
        <RuleEditor
          key={editor._id || "new"}
          initial={editor._id ? editor : null}
          kind={kind}
          today={data.today}
          onSave={(rule) => save(rule, editor._id)}
          busy={Boolean(active)}
          onCancel={() => {
            setEditor(null);
            setError(null);
          }}
        />
      )}
      {!editor && !!data && !data.rules.length && (
        <section
          className={`${card} flex flex-col items-start gap-3 p-6 sm:p-8`}
        >
          <Icon className="size-6 text-[var(--color-secondary)]" aria-hidden />
          <h2 className="text-lg font-semibold text-[var(--color-accent)]">
            {recurring ? "No schedules yet" : "No quick transactions yet"}
          </h2>
          <button className={primary} onClick={() => setEditor({})}>
            <FiPlus />
            {newLabel}
          </button>
        </section>
      )}
      {!editor && !!data?.rules.length && (
        <ul className="space-y-3">
          {data.rules.map((rule) => (
            <li key={rule._id} className={`${card} space-y-3 p-4 sm:p-5`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="break-words text-lg font-semibold text-[var(--color-accent)]">
                    {rule.title}
                  </h2>
                  <p className="mt-1 text-sm capitalize text-[var(--color-secondary)]">
                    {rule.category} · {rule.type}
                  </p>
                </div>
                <span
                  className={`shrink-0 tabular-nums font-semibold ${rule.type === "income" ? "text-emerald-400" : "text-[var(--color-accent)]"}`}
                >
                  {money.format(rule.amount)}
                </span>
              </div>
              {recurring && (
                <div className="text-sm text-[var(--color-secondary)]">
                  {rule.weekdays.length === 7
                    ? "Every day"
                    : order
                        .filter((day) => rule.weekdays.includes(day))
                        .map((day) => days[day].slice(0, 3))
                        .join(", ")}
                  {" · "}
                  {rule.paused
                    ? "Paused"
                    : rule.nextDate &&
                      `Next ${dateLabel.format(new Date(rule.nextDate))}`}
                </div>
              )}
              {remove === rule._id ? (
                <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--color-accent)]">
                  <span>
                    Remove this {recurring ? "schedule" : "quick transaction"}?
                  </span>
                  <button
                    className={secondary}
                    disabled={Boolean(active)}
                    onClick={() =>
                      act(rule._id, { action: "remove", id: rule._id }, () => {
                        setData((current) => ({
                          ...current,
                          rules: current.rules.filter(
                            (item) => item._id !== rule._id,
                          ),
                        }));
                        setRemove(null);
                        setNotice("Removed.");
                      })
                    }
                  >
                    Remove
                  </button>
                  <button
                    className={secondary}
                    disabled={Boolean(active)}
                    onClick={() => setRemove(null)}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {recurring ? (
                    <button
                      className={secondary}
                      disabled={Boolean(active)}
                      onClick={() =>
                        save({ ...rule, paused: !rule.paused }, rule._id)
                      }
                    >
                      {rule.paused ? "Resume" : "Pause"}
                    </button>
                  ) : (
                    <button
                      className={primary}
                      disabled={Boolean(active)}
                      onClick={() => {
                        const id = rule._id;
                        const requestId = (requestIds.current[id] ??=
                          crypto.randomUUID());
                        act(id, { action: "add", id, requestId }, () => {
                          delete requestIds.current[id];
                          setNotice(`${rule.title} added.`);
                        });
                      }}
                    >
                      {active === rule._id ? "Adding…" : "Add now"}
                    </button>
                  )}
                  <button
                    className={secondary}
                    disabled={Boolean(active)}
                    onClick={() => {
                      setEditor(rule);
                      setNotice("");
                    }}
                  >
                    Edit<span className="sr-only"> {rule.title}</span>
                  </button>
                  <button
                    className={secondary}
                    disabled={Boolean(active)}
                    onClick={() => {
                      setRemove(rule._id);
                      setNotice("");
                    }}
                  >
                    Remove<span className="sr-only"> {rule.title}</span>
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

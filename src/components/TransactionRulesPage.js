"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import TransactionFormDialog from "@/components/TransactionFormDialog";
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

export default function TransactionRulesPage({ kind }) {
  const recurring = kind === "recurring";
  const title = recurring ? "Recurring transactions" : "Quick transactions";
  const newLabel = recurring ? "New transaction" : "New quick transaction";
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
      {error && !editor && (
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
        <TransactionFormDialog
          key={editor._id || "new"}
          editing={editor._id ? editor : null}
          setup={{
            kind,
            today: data.today,
            title: editor._id
              ? recurring
                ? "Edit schedule"
                : "Edit quick transaction"
              : newLabel,
            submitLabel: editor._id
              ? "Save changes"
              : recurring
                ? "Save schedule"
                : "Save quick transaction",
            onSave: (rule) => save(rule, editor._id),
            busy: Boolean(active),
            error: error?.message,
          }}
          onClose={() => {
            setEditor(null);
            setError(null);
          }}
        />
      )}
      {!!data && !data.rules.length && (
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
      {!!data?.rules.length && (
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

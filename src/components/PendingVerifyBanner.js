"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { FiCheck, FiClock, FiX } from "react-icons/fi";
import { toast } from "@/components/sonner";
import CustomSelect from "@/components/CustomSelect";

const CATEGORIES = [
  "Food",
  "Travel",
  "Shopping",
  "Bills",
  "Entertainment",
  "Other",
];

async function fetchPending(user, signal) {
  const response = await fetch(
    `/api/budgets?user=${encodeURIComponent(user)}&status=pending`,
    { signal },
  );
  if (!response.ok) throw new Error("Unable to load pending transactions");
  return response.json();
}

async function updatePending({ user, transaction, action, category }) {
  const response = await fetch("/api/budgets", {
    method: action === "approve" ? "PATCH" : "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(
      action === "approve"
        ? { id: transaction._id, user, status: "verified", category }
        : { id: transaction._id, user, pendingOnly: true },
    ),
  });
  if (!response.ok)
    throw new Error(
      action === "approve"
        ? "Unable to approve transaction"
        : "Unable to dismiss transaction",
    );
  return response.json();
}

export default function PendingVerifyBanner({ user }) {
  const queryClient = useQueryClient();
  const queryKey = ["pending-budgets", user];
  const {
    data = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey,
    queryFn: ({ signal }) => fetchPending(user, signal),
    enabled: !!user,
  });
  const mutation = useMutation({
    mutationFn: updatePending,
    onSuccess: (_, variables) => {
      toast.success(
        variables.action === "approve"
          ? "Transaction approved"
          : "Transaction dismissed",
      );
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["budgets", user] });
    },
    onError: (error) => toast.error(error.message),
  });

  if (!user || isLoading || isError || data.length === 0) return null;

  return (
    <section
      aria-labelledby="pending-review-heading"
      className="mb-6 rounded-xl border border-amber-300/15 bg-[#0a0a0a]/90 p-4 sm:p-5 shadow-[0_12px_40px_rgba(0,0,0,0.2)]"
    >
      <div className="mb-4 flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-amber-300/15 bg-amber-300/8 text-amber-200/80">
          <FiClock size={16} />
        </span>
        <div className="min-w-0">
          <h2
            id="pending-review-heading"
            className="font-grotesk text-sm font-semibold text-accent"
          >
            {data.length} Auto-Parsed GPay Transaction
            {data.length === 1 ? "" : "s"} Need Review
          </h2>
          <p className="mt-1 text-xs text-secondary/45">
            These won’t affect your balance until you approve them.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {data.map((transaction) => (
          <PendingRow
            key={transaction._id}
            transaction={transaction}
            busy={mutation.isPending}
            onApprove={(category) =>
              mutation.mutate({
                user,
                transaction,
                action: "approve",
                category,
              })
            }
            onDismiss={() =>
              mutation.mutate({ user, transaction, action: "dismiss" })
            }
          />
        ))}
      </div>
    </section>
  );
}

function PendingRow({ transaction, busy, onApprove, onDismiss }) {
  const [category, setCategory] = React.useState(
    CATEGORIES.includes(transaction.category) ? transaction.category : "Other",
  );
  const date = new Date(transaction.createdAt);
  const timestamp = Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="grid grid-cols-1 gap-3 rounded-lg border border-white/6 bg-white/[0.02] p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="max-w-full truncate text-sm font-medium text-accent">
            {transaction.title || "UPI transaction"}
          </p>
          <span className="font-grotesk text-sm font-semibold tabular-nums text-red-300">
            −₹{Number(transaction.amount || 0).toLocaleString("en-IN")}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-secondary/40">{timestamp}</p>
        {transaction.rawSmsSnippet && (
          <p className="mt-1 truncate text-[11px] text-secondary/35">
            {transaction.rawSmsSnippet}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <CustomSelect
          aria-label={`Category for ${transaction.title}`}
          value={category}
          onChange={setCategory}
          options={CATEGORIES.map((value) => ({ label: value, value }))}
          className="min-w-32"
          buttonClassName="min-h-9 h-9 px-3 text-xs"
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => onApprove(category)}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-400/10 px-3 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-400/15 disabled:opacity-50"
        >
          <FiCheck size={14} /> Approve
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onDismiss}
          aria-label={`Dismiss ${transaction.title || "pending transaction"}`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/8 text-secondary/50 transition hover:border-red-400/20 hover:bg-red-400/8 hover:text-red-300 disabled:opacity-50"
        >
          <FiX size={15} />
        </button>
      </div>
    </div>
  );
}

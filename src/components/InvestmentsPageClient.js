"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  FiArrowDownRight,
  FiArrowUpRight,
  FiPlus,
  FiRefreshCw,
  FiTrash2,
} from "react-icons/fi";
import { toast } from "@/components/sonner";
import InvestmentModal, {
  ASSET_TYPES,
  dateInput,
} from "@/components/InvestmentModal";
import { FREQUENCIES, formatPaymentDate } from "@/lib/investmentSchedule";
import NumberTicker from "@/components/ui/NumberTicker";

const formatINR = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
async function getInvestments(user, signal) {
  const response = await fetch(
    `/api/investments?user=${encodeURIComponent(user)}`,
    { signal },
  );
  if (!response.ok) throw new Error("Unable to load portfolio");
  return response.json();
}

async function getPrice(investment, signal) {
  const params = new URLSearchParams({
    symbol: investment.symbol || "custom",
    assetType: investment.assetType,
  });
  const response = await fetch(`/api/investments/prices?${params}`, { signal });
  if (!response.ok) throw new Error("Unable to load price");
  return response.json();
}

async function saveInvestment(data) {
  const response = await fetch("/api/investments", {
    method: data._id ? "PATCH" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data._id ? { ...data, id: data._id } : data),
  });
  if (!response.ok)
    throw new Error(
      (await response.json()).error || "Unable to save investment",
    );
  return response.json();
}

async function removeInvestment({ id, userId }) {
  const response = await fetch("/api/investments", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, userId }),
  });
  if (!response.ok) throw new Error("Unable to remove investment");
  return response.json();
}

export default function InvestmentsPageClient() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [user, setUser] = useState("");
  const [ready, setReady] = useState(false);
  const [modal, setModal] = useState(null);

  useEffect(() => {
    const savedUser = (localStorage.getItem("username") || "")
      .trim()
      .toLowerCase();
    if (!savedUser) {
      router.replace("/login");
      return;
    }
    setUser(savedUser);
    setReady(true);
  }, [router]);

  const {
    data: investments = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["investments", user],
    queryFn: ({ signal }) => getInvestments(user, signal),
    enabled: !!user,
  });
  const quotes = useQueries({
    queries: investments.map((investment) => ({
      queryKey: [
        "investment-price",
        investment._id,
        investment.symbol,
        investment.assetType,
      ],
      queryFn: ({ signal }) => getPrice(investment, signal),
      enabled: !!investment.symbol && investment.assetType !== "custom",
      staleTime: 10 * 60 * 1000,
      retry: false,
    })),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["investments", user] });
    queryClient.invalidateQueries({ queryKey: ["budgets", user] });
  };
  const saveMutation = useMutation({
    mutationFn: saveInvestment,
    onSuccess: () => {
      toast.success(
        modal?.plan
          ? "Payment recorded"
          : modal?.investment
            ? "Investment updated"
            : "Investment added",
      );
      invalidate();
      setModal(null);
    },
    onError: (error) => toast.error(error.message),
  });
  function openForm(nextModal) {
    saveMutation.reset();
    setModal(nextModal);
  }
  const deleteMutation = useMutation({
    mutationFn: removeInvestment,
    onSuccess: () => {
      toast.success("Holding removed");
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const holdings = useMemo(
    () =>
      investments.map((investment, index) => {
        const quote = quotes[index]?.data;
        const livePrice =
          quote?.currentPrice ??
          (investment.manualCurrentValue != null
            ? investment.manualCurrentValue / investment.units
            : investment.buyPrice);
        const currentValue = livePrice * Number(investment.units);
        const invested = Number(investment.investedAmount) || 0;
        const returns = currentValue - invested;
        return {
          ...investment,
          livePrice,
          currentValue,
          returns,
          returnRate: invested ? (returns / invested) * 100 : 0,
          quote,
        };
      }),
    [investments, quotes],
  );

  const totals = useMemo(
    () =>
      holdings.reduce(
        (sum, item) => ({
          invested: sum.invested + Number(item.investedAmount || 0),
          current: sum.current + item.currentValue,
        }),
        { invested: 0, current: 0 },
      ),
    [holdings],
  );
  const returns = totals.current - totals.invested;
  const returnRate = totals.invested ? (returns / totals.invested) * 100 : 0;
  const allocation = useMemo(() => {
    const groups = new Map();
    holdings.forEach((item) =>
      groups.set(
        item.assetType,
        (groups.get(item.assetType) || 0) + item.currentValue,
      ),
    );
    return [...groups.entries()].map(([type, value]) => ({
      type,
      value,
      percent: totals.current ? (value / totals.current) * 100 : 0,
    }));
  }, [holdings, totals]);

  if (!ready || isLoading) {
    return (
      <main className="mx-auto max-w-7xl px-6 pb-16 pt-32">
        <div className="h-56 animate-pulse rounded-2xl border border-white/6 bg-[#0a0a0a]" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 pb-24 pt-28 sm:px-10 lg:px-16">
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <h1 className="font-grotesk text-3xl font-semibold tracking-tight text-(--color-accent)">
            Investments
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => quotes.forEach((query) => query.refetch())}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/4 px-4 py-2.5 text-sm font-medium text-(--color-secondary)/70 transition hover:bg-white/8 hover:text-(--color-accent)"
          >
            <FiRefreshCw size={14} /> Refresh prices
          </button>
          <button
            type="button"
            onClick={() => openForm({})}
            className="inline-flex items-center gap-2 rounded-lg bg-(--color-primary) px-4 py-2.5 text-sm font-semibold text-(--color-dark) transition hover:bg-(--color-secondary)"
          >
            <FiPlus size={15} /> Add investment
          </button>
        </div>
      </motion.header>

      {isError && (
        <div
          role="alert"
          className="mb-5 rounded-lg border border-red-400/15 bg-red-400/5 px-4 py-3 text-sm text-red-200/80"
        >
          Could not load investments. Refresh to try again.
        </div>
      )}

      <section className="mb-6 rounded-2xl border border-white/8 bg-[#0a0a0a] p-6 sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-(--color-secondary)/40">
              Current portfolio value
            </p>
            <p className="font-grotesk text-4xl font-semibold tabular-nums tracking-tight text-(--color-accent) sm:text-5xl">
              ₹
              <NumberTicker
                target={totals.current}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </p>
            <div
              className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums ${returns >= 0 ? "bg-emerald-400/8 text-emerald-300" : "bg-red-400/8 text-red-300"}`}
            >
              {returns >= 0 ? (
                <FiArrowUpRight size={14} />
              ) : (
                <FiArrowDownRight size={14} />
              )}
              {returns >= 0 ? "+" : "−"}
              {formatINR(Math.abs(returns))} ({returns >= 0 ? "+" : ""}
              {returnRate.toFixed(2)}%)
              <span className="font-normal text-current/55">total return</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <SummaryValue label="Total invested" value={totals.invested} />
            <SummaryValue label="Holdings" value={holdings.length} count />
          </div>
        </div>
        <div className="mt-7 border-t border-white/6 pt-5">
          <div className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-widest text-(--color-secondary)/35">
            <span>Allocation</span>
          </div>
          <div className="flex h-2 overflow-hidden rounded-full bg-white/5">
            {allocation.map((item, index) => (
              <div
                key={item.type}
                title={`${ASSET_TYPES[item.type]}: ${item.percent.toFixed(1)}%`}
                className={
                  index % 4 === 0
                    ? "bg-(--color-primary)"
                    : index % 4 === 1
                      ? "bg-emerald-400/80"
                      : index % 4 === 2
                        ? "bg-violet-400/80"
                        : "bg-amber-300/80"
                }
                style={{ width: `${item.percent}%` }}
              />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
            {allocation.map((item, index) => (
              <span
                key={item.type}
                className="inline-flex items-center gap-1.5 text-[11px] capitalize text-(--color-secondary)/45"
              >
                <i
                  className={`h-1.5 w-1.5 rounded-full ${index % 4 === 0 ? "bg-(--color-primary)" : index % 4 === 1 ? "bg-emerald-400/80" : index % 4 === 2 ? "bg-violet-400/80" : "bg-amber-300/80"}`}
                />
                {ASSET_TYPES[item.type]}{" "}
                <span className="tabular-nums text-(--color-secondary)/30">
                  {item.percent.toFixed(0)}%
                </span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {investments.some((investment) => investment.schedule) && (
        <section
          aria-labelledby="sip-heading"
          className="mb-6 rounded-2xl border border-white/8 bg-[#0a0a0a]"
        >
          <h2
            id="sip-heading"
            className="border-b border-white/8 px-5 py-4 font-grotesk text-base font-semibold text-(--color-accent) sm:px-6"
          >
            Recurring investments
          </h2>
          <ul className="divide-y divide-white/8">
            {investments
              .filter((investment) => investment.schedule)
              .sort((a, b) =>
                a.schedule.nextDate.localeCompare(b.schedule.nextDate),
              )
              .map((plan) => (
                <li
                  key={plan._id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6"
                >
                  <div className="min-w-0">
                    <p className="break-words text-sm font-semibold text-(--color-accent)">
                      {plan.name}
                    </p>
                    <p className="mt-1 text-xs text-white/60">
                      {FREQUENCIES[plan.schedule.frequency]} ·{" "}
                      {formatINR(plan.schedule.amount)} ·{" "}
                      {plan.schedule.nextDate < dateInput()
                        ? "Overdue"
                        : "Next payment"}{" "}
                      {formatPaymentDate(plan.schedule.nextDate)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-lg px-3 py-2 text-sm text-white/65 hover:bg-white/8 hover:text-(--color-accent)"
                      onClick={() => openForm({ investment: plan })}
                    >
                      Edit schedule
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-white/12 px-3 py-2 text-sm font-medium text-(--color-accent) hover:bg-white/8"
                      onClick={() => openForm({ plan })}
                    >
                      Record payment
                    </button>
                  </div>
                </li>
              ))}
          </ul>
        </section>
      )}

      <section className="overflow-hidden rounded-2xl border border-white/8 bg-[#0a0a0a]">
        <div className="flex items-center justify-between border-b border-white/6 px-5 py-4 sm:px-6">
          <div>
            <h2 className="font-grotesk text-base font-semibold text-(--color-accent)">
              Holdings
            </h2>
          </div>
        </div>
        {holdings.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <h3 className="font-grotesk text-sm font-semibold text-(--color-accent)/80">
              No holdings yet
            </h3>
            <button
              type="button"
              onClick={() => openForm({})}
              className="mt-4 text-xs font-semibold text-(--color-primary) hover:text-(--color-secondary)"
            >
              Add investment
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead>
                <tr className="border-b border-white/5 text-[10px] font-semibold uppercase tracking-widest text-(--color-secondary)/35">
                  <th className="px-5 py-3 sm:px-6">Holding</th>
                  <th className="px-4 py-3">Purchase date</th>
                  <th className="px-4 py-3 text-right">Invested</th>
                  <th className="px-4 py-3 text-right">Buy / live</th>
                  <th className="px-4 py-3 text-right">Current value</th>
                  <th className="px-4 py-3 text-right">Return</th>
                  <th className="px-5 py-3 sm:px-6">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((holding, index) => (
                  <HoldingRow
                    key={holding._id}
                    holding={holding}
                    quote={quotes[index]}
                    onEdit={() => openForm({ investment: holding })}
                    onDelete={() =>
                      deleteMutation.mutate({ id: holding._id, userId: user })
                    }
                    deleting={deleteMutation.isPending}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modal && (
        <InvestmentModal
          user={user}
          investment={modal.investment}
          plan={modal.plan}
          saving={saveMutation.isPending}
          saveError={saveMutation.error?.message}
          onClose={() => setModal(null)}
          onSave={saveMutation.mutate}
        />
      )}
    </main>
  );
}

function SummaryValue({ label, value, count = false }) {
  return (
    <div className="rounded-xl border border-white/6 bg-white/[0.02] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-(--color-secondary)/35">
        {label}
      </p>
      <p className="mt-1 font-grotesk text-lg font-semibold tabular-nums text-(--color-accent)">
        {count ? (
          value
        ) : (
          <>
            <span className="text-sm text-(--color-secondary)/45">₹</span>
            <NumberTicker
              target={value}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </>
        )}
      </p>
    </div>
  );
}

function HoldingRow({ holding, quote, onEdit, onDelete, deleting }) {
  return (
    <tr className="border-b border-white/4 last:border-0 transition hover:bg-white/[0.015]">
      <td className="px-5 py-4 sm:px-6">
        <p className="max-w-64 truncate text-sm font-medium text-(--color-accent)">
          {holding.name}
        </p>
        <p className="mt-1 text-[10px] uppercase tracking-wider text-(--color-secondary)/35">
          {holding.symbol || "Manual holding"} ·{" "}
          {ASSET_TYPES[holding.assetType]}
        </p>
      </td>
      <td className="px-4 py-4 text-xs text-(--color-secondary)/50">
        {new Date(holding.purchaseDate).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </td>
      <td className="px-4 py-4 text-right font-grotesk text-xs tabular-nums text-(--color-secondary)/65">
        {formatINR(holding.investedAmount)}
      </td>
      <td className="px-4 py-4 text-right">
        <p className="text-xs tabular-nums text-(--color-secondary)/65">
          {formatINR(holding.buyPrice)}
        </p>
        <p className="mt-1 text-[10px] tabular-nums text-(--color-secondary)/35">
          {quote?.isFetching ? "Updating…" : formatINR(holding.livePrice)}
        </p>
      </td>
      <td className="px-4 py-4 text-right font-grotesk text-xs font-semibold tabular-nums text-(--color-accent)">
        {formatINR(holding.currentValue)}
        <p className="mt-1 text-[10px] font-normal text-(--color-secondary)/35">
          {Number(holding.units).toLocaleString("en-IN", {
            maximumFractionDigits: 4,
          })}{" "}
          units
        </p>
      </td>
      <td
        className={`px-4 py-4 text-right text-xs font-semibold tabular-nums ${holding.returns >= 0 ? "text-emerald-300" : "text-red-300"}`}
      >
        {holding.returns >= 0 ? "+" : "−"}
        {formatINR(Math.abs(holding.returns))}
        <p className="mt-1 text-[10px] font-normal">
          {holding.returns >= 0 ? "+" : ""}
          {holding.returnRate.toFixed(2)}%
        </p>
      </td>
      <td className="px-5 py-4 sm:px-6">
        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${holding.name}`}
            className="rounded-md px-2 py-1 text-[11px] text-(--color-secondary)/50 hover:bg-white/5 hover:text-(--color-accent)"
          >
            Edit
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={onDelete}
            aria-label={`Delete ${holding.name}`}
            className="flex h-7 w-7 items-center justify-center rounded-md text-(--color-secondary)/35 hover:bg-red-400/8 hover:text-red-300 disabled:opacity-40"
          >
            <FiTrash2 size={13} />
          </button>
        </div>
      </td>
    </tr>
  );
}

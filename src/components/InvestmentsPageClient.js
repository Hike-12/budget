"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  FiActivity,
  FiArrowDownRight,
  FiArrowUpRight,
  FiPlus,
  FiRefreshCw,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { toast } from "@/components/sonner";
import CustomDatePicker from "@/components/CustomDatePicker";
import NumberTicker from "@/components/ui/NumberTicker";

const PRESETS = [
  {
    name: "Nippon India ETF Gold BeES",
    symbol: "GOLDBEES.NS",
    assetType: "gold",
  },
  {
    name: "Nippon India ETF Nifty 50 BeES",
    symbol: "NIFTYBEES.NS",
    assetType: "etf",
  },
  {
    name: "Nippon India ETF Silver BeES",
    symbol: "SILVERBEES.NS",
    assetType: "etf",
  },
  {
    name: "Parag Parikh Flexi Cap Fund · Direct Growth",
    symbol: "122639",
    assetType: "mutual_fund",
  },
  {
    name: "HDFC Nifty 50 Index Fund · Direct Growth",
    symbol: "119063",
    assetType: "mutual_fund",
  },
];
const ASSET_TYPES = ["etf", "stock", "mutual_fund", "gold", "custom"];
const formatINR = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const dateInput = (value) => {
  const date = new Date(value);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
};

async function getInvestments(user, signal) {
  const response = await fetch(
    `/api/investments?user=${encodeURIComponent(user)}`,
    { signal },
  );
  if (!response.ok) throw new Error("Unable to load portfolio");
  return response.json();
}

async function getPrice(investment, historicalDate) {
  const params = new URLSearchParams({
    symbol: investment.symbol || "custom",
    assetType: investment.assetType,
  });
  if (historicalDate) params.set("date", historicalDate);
  if (investment.buyPrice)
    params.set("fallbackPrice", String(investment.buyPrice));
  const response = await fetch(`/api/investments/prices?${params}`);
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
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

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
      queryFn: () =>
        getPrice({
          ...investment,
          fallbackPrice:
            investment.manualCurrentValue && investment.units
              ? investment.manualCurrentValue / investment.units
              : investment.buyPrice,
        }),
      enabled: !!investment.symbol || investment.assetType === "custom",
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
        editing ? "Holding updated" : "Investment added to your ledger",
      );
      invalidate();
      setShowForm(false);
      setEditing(null);
    },
    onError: (error) => toast.error(error.message),
  });
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
          Number(quote?.currentPrice) ||
          (investment.manualCurrentValue && investment.units
            ? Number(investment.manualCurrentValue) / Number(investment.units)
            : Number(investment.buyPrice));
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
          <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-white/8 bg-white/4 px-2.5 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-primary/80">
              Portfolio
            </span>
          </div>
          <h1 className="font-grotesk text-3xl font-semibold tracking-tight text-accent">
            Investments
          </h1>
          <p className="mt-1 text-sm text-secondary/40">
            Track your holdings alongside the cash that funded them.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => quotes.forEach((query) => query.refetch())}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/4 px-4 py-2.5 text-sm font-medium text-secondary/70 transition hover:bg-white/8 hover:text-accent"
          >
            <FiRefreshCw size={14} /> Refresh Live Prices
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-dark transition hover:bg-secondary"
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
          Your portfolio could not be loaded. Please refresh and try again.
        </div>
      )}

      <section className="mb-6 rounded-2xl border border-white/8 bg-[#0a0a0a] p-6 sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary/40">
              Current portfolio value
            </p>
            <p className="font-grotesk text-4xl font-semibold tabular-nums tracking-tight text-accent sm:text-5xl">
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
          <div className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-widest text-secondary/35">
            <span>Allocation</span>
            <span>
              {holdings.length} holding{holdings.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="flex h-2 overflow-hidden rounded-full bg-white/5">
            {allocation.map((item, index) => (
              <div
                key={item.type}
                title={`${item.type}: ${item.percent.toFixed(1)}%`}
                className={
                  index % 4 === 0
                    ? "bg-primary"
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
                className="inline-flex items-center gap-1.5 text-[11px] capitalize text-secondary/45"
              >
                <i
                  className={`h-1.5 w-1.5 rounded-full ${index % 4 === 0 ? "bg-primary" : index % 4 === 1 ? "bg-emerald-400/80" : index % 4 === 2 ? "bg-violet-400/80" : "bg-amber-300/80"}`}
                />
                {item.type.replace("_", " ")}{" "}
                <span className="tabular-nums text-secondary/30">
                  {item.percent.toFixed(0)}%
                </span>
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-white/8 bg-[#0a0a0a]">
        <div className="flex items-center justify-between border-b border-white/6 px-5 py-4 sm:px-6">
          <div>
            <h2 className="font-grotesk text-base font-semibold text-accent">
              Holdings
            </h2>
            <p className="mt-0.5 text-xs text-secondary/35">
              Values update from market quotes when available.
            </p>
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/8 bg-white/3 text-secondary/45">
            <FiActivity size={15} />
          </span>
        </div>
        {holdings.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-white/8 bg-white/3 text-secondary/40">
              <FiActivity size={18} />
            </div>
            <h3 className="font-grotesk text-sm font-semibold text-accent/80">
              No holdings yet
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-secondary/35">
              Add your first investment. Its purchase will also appear as an
              outflow in your main ledger.
            </p>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="mt-4 text-xs font-semibold text-primary hover:text-secondary"
            >
              Add an investment
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead>
                <tr className="border-b border-white/5 text-[10px] font-semibold uppercase tracking-widest text-secondary/35">
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
                    onEdit={() => {
                      setEditing(holding);
                      setShowForm(true);
                    }}
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

      <AnimatePresence>
        {showForm && (
          <InvestmentModal
            user={user}
            investment={editing}
            saving={saveMutation.isPending}
            onClose={() => {
              setShowForm(false);
              setEditing(null);
            }}
            onSave={(data) => saveMutation.mutate(data)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

function SummaryValue({ label, value, count = false }) {
  return (
    <div className="rounded-xl border border-white/6 bg-white/[0.02] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-secondary/35">
        {label}
      </p>
      <p className="mt-1 font-grotesk text-lg font-semibold tabular-nums text-accent">
        {count ? (
          value
        ) : (
          <>
            <span className="text-sm text-secondary/45">₹</span>
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
        <p className="max-w-64 truncate text-sm font-medium text-accent">
          {holding.name}
        </p>
        <p className="mt-1 text-[10px] uppercase tracking-wider text-secondary/35">
          {holding.symbol || "Manual holding"} ·{" "}
          {holding.assetType.replace("_", " ")}
        </p>
      </td>
      <td className="px-4 py-4 text-xs text-secondary/50">
        {new Date(holding.purchaseDate).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </td>
      <td className="px-4 py-4 text-right font-grotesk text-xs tabular-nums text-secondary/65">
        {formatINR(holding.investedAmount)}
      </td>
      <td className="px-4 py-4 text-right">
        <p className="text-xs tabular-nums text-secondary/65">
          {formatINR(holding.buyPrice)}
        </p>
        <p className="mt-1 text-[10px] tabular-nums text-secondary/35">
          {quote?.isFetching ? "Updating…" : formatINR(holding.livePrice)}
        </p>
      </td>
      <td className="px-4 py-4 text-right font-grotesk text-xs font-semibold tabular-nums text-accent">
        {formatINR(holding.currentValue)}
        <p className="mt-1 text-[10px] font-normal text-secondary/35">
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
            className="rounded-md px-2 py-1 text-[11px] text-secondary/50 hover:bg-white/5 hover:text-accent"
          >
            Edit
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={onDelete}
            aria-label={`Delete ${holding.name}`}
            className="flex h-7 w-7 items-center justify-center rounded-md text-secondary/35 hover:bg-red-400/8 hover:text-red-300 disabled:opacity-40"
          >
            <FiTrash2 size={13} />
          </button>
        </div>
      </td>
    </tr>
  );
}

function InvestmentModal({ user, investment, saving, onClose, onSave }) {
  const [form, setForm] = useState(() =>
    investment
      ? {
          ...investment,
          purchaseDate: dateInput(investment.purchaseDate),
          manualCurrentValue: investment.manualCurrentValue ?? "",
        }
      : {
          name: PRESETS[0].name,
          symbol: PRESETS[0].symbol,
          assetType: PRESETS[0].assetType,
          investedAmount: "",
          units: "",
          buyPrice: "",
          purchaseDate: dateInput(new Date()),
          notes: "",
          manualCurrentValue: "",
        },
  );
  const [priceState, setPriceState] = useState({ loading: false, message: "" });
  const set = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));

  const choosePreset = (symbol) => {
    const preset = PRESETS.find((item) => item.symbol === symbol);
    if (preset) {
      const nextForm = { ...form, ...preset };
      setForm(nextForm);
      fetchHistoricalPrice(form.purchaseDate, nextForm);
    }
  };

  const fetchHistoricalPrice = async (
    date = form.purchaseDate,
    targetForm = form,
  ) => {
    if (!targetForm.symbol || !date) return;
    setPriceState({ loading: true, message: "Looking up the closest price…" });
    try {
      const price = await getPrice(targetForm, date);
      if (Number(price.historicalPrice) > 0) {
        const nextBuyPrice = Number(price.historicalPrice);
        setForm((current) => ({
          ...current,
          buyPrice: String(nextBuyPrice),
          units: current.investedAmount
            ? String(Number(current.investedAmount) / nextBuyPrice)
            : current.units,
        }));
        setPriceState({
          loading: false,
          message: `Price from ${price.historicalDate || date}`,
        });
      } else {
        setPriceState({
          loading: false,
          message:
            "No historical quote found. Enter the purchase price manually.",
        });
      }
    } catch {
      setPriceState({
        loading: false,
        message: "Live lookup failed. Enter the purchase price manually.",
      });
    }
  };

  useEffect(() => {
    fetchHistoricalPrice(); // Load the initial purchase date for new entries.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    const amount = Number(form.investedAmount);
    const buyPrice = Number(form.buyPrice);
    const units =
      Number(form.units) > 0 ? Number(form.units) : amount / buyPrice;
    if (!form.name?.trim() || !amount || amount < 0 || !buyPrice || !units) {
      toast.error("Add a name, amount, and valid buy price");
      return;
    }
    onSave({
      ...(form._id ? { _id: form._id } : {}),
      userId: user,
      name: form.name.trim(),
      symbol: form.symbol.trim(),
      assetType: form.assetType,
      investedAmount: amount,
      buyPrice,
      units,
      purchaseDate: new Date(`${form.purchaseDate}T12:00:00`).toISOString(),
      notes: form.notes || "",
      ...(form.manualCurrentValue !== ""
        ? { manualCurrentValue: Number(form.manualCurrentValue) }
        : {}),
    });
  };

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button
        type="button"
        aria-label="Close investment form"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="investment-modal-title"
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        className="relative z-10 max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#080808] p-5 shadow-2xl sm:p-7"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-secondary/45 hover:bg-white/5 hover:text-accent"
        >
          <FiX />
        </button>
        <div className="mb-6">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-primary/75">
            Portfolio ledger
          </p>
          <h2
            id="investment-modal-title"
            className="font-grotesk text-xl font-semibold text-accent"
          >
            {investment ? "Edit holding" : "Add an investment"}
          </h2>
          <p className="mt-1 text-xs text-secondary/40">
            The purchase is recorded as a verified Investment outflow.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!investment && (
            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-widest text-secondary/40">
                Quick picks
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.symbol}
                    type="button"
                    onClick={() => choosePreset(preset.symbol)}
                    className={`rounded-lg border px-3 py-2 text-[11px] transition ${form.symbol === preset.symbol ? "border-primary/30 bg-primary/10 text-primary" : "border-white/8 bg-white/[0.02] text-secondary/50 hover:text-accent"}`}
                  >
                    {preset.name.split(" · ")[0]}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Investment name">
              <input
                required
                value={form.name}
                onChange={(event) => set("name", event.target.value)}
                className={inputClass}
                placeholder="Name this holding"
              />
            </Field>
            <Field label="Asset type">
              <select
                value={form.assetType}
                onChange={(event) => set("assetType", event.target.value)}
                className={inputClass}
              >
                {ASSET_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type
                      .replace("_", " ")
                      .replace(/^./, (char) => char.toUpperCase())}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Ticker or AMFI scheme code">
              <input
                value={form.symbol}
                onChange={(event) => set("symbol", event.target.value)}
                className={inputClass}
                placeholder="GOLDBEES.NS or 122639"
              />
            </Field>
            <Field label="Purchase date">
              <CustomDatePicker
                value={form.purchaseDate}
                onChange={(value) => {
                  const nextForm = { ...form, purchaseDate: value };
                  setForm(nextForm);
                  fetchHistoricalPrice(value, nextForm);
                }}
              />
            </Field>
            <Field label="Investment amount (₹)">
              <input
                required
                inputMode="decimal"
                value={form.investedAmount}
                onChange={(event) => {
                  const investedAmount = event.target.value;
                  setForm((current) => ({
                    ...current,
                    investedAmount,
                    units: Number(current.buyPrice)
                      ? String(
                          Number(investedAmount) / Number(current.buyPrice),
                        )
                      : current.units,
                  }));
                }}
                className={inputClass}
                placeholder="0.00"
              />
            </Field>
            <Field label="Buy price per unit (₹)">
              <input
                required
                inputMode="decimal"
                value={form.buyPrice}
                onChange={(event) => {
                  const buyPrice = event.target.value;
                  setForm((current) => ({
                    ...current,
                    buyPrice,
                    units: Number(buyPrice)
                      ? String(
                          Number(current.investedAmount) / Number(buyPrice),
                        )
                      : current.units,
                  }));
                }}
                className={inputClass}
                placeholder="Fetched for purchase date"
              />
            </Field>
            <Field label="Units">
              <input
                inputMode="decimal"
                value={form.units}
                onChange={(event) => set("units", event.target.value)}
                className={inputClass}
                placeholder="Calculated from amount ÷ price"
              />
            </Field>
            <Field label="Current value override (₹, optional)">
              <input
                inputMode="decimal"
                value={form.manualCurrentValue}
                onChange={(event) =>
                  set("manualCurrentValue", event.target.value)
                }
                className={inputClass}
                placeholder="Used if live prices are unavailable"
              />
            </Field>
            <Field label="Notes" className="sm:col-span-2">
              <textarea
                value={form.notes}
                onChange={(event) => set("notes", event.target.value)}
                rows={2}
                className={`${inputClass} resize-none`}
                placeholder="Optional context"
              />
            </Field>
          </div>
          {priceState.message && (
            <p aria-live="polite" className="text-[11px] text-secondary/45">
              {priceState.loading && (
                <FiRefreshCw className="mr-1 inline animate-spin" />
              )}
              {priceState.message}
            </p>
          )}
          <p className="rounded-lg border border-white/6 bg-white/[0.02] px-3 py-2 text-xs text-secondary/45">
            Logs {form.investedAmount ? formatINR(form.investedAmount) : "₹0"}{" "}
            as an Investment outflow on{" "}
            {form.purchaseDate
              ? new Date(`${form.purchaseDate}T12:00:00`).toLocaleDateString(
                  "en-IN",
                  { day: "numeric", month: "short", year: "numeric" },
                )
              : "the selected date"}{" "}
            in your main ledger.
          </p>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/8 px-4 py-2.5 text-xs font-medium text-secondary/55 hover:text-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-dark transition hover:bg-secondary disabled:opacity-50"
            >
              {saving ? "Saving…" : investment ? "Save changes" : "Add holding"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

const inputClass =
  "h-10 w-full rounded-lg border border-white/8 bg-[#0e0e0e] px-3 text-sm text-accent placeholder:text-secondary/25 focus:border-primary/40 focus:outline-none";

function Field({ label, children, className = "" }) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-secondary/40">
        {label}
      </label>
      {children}
    </div>
  );
}

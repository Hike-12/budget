"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FiChevronDown, FiSearch, FiX } from "react-icons/fi";
import {
  FREQUENCIES,
  formatPaymentDate,
  nextPaymentDate,
} from "@/lib/investmentSchedule";

export const ASSET_TYPES = {
  mutual_fund: "Mutual fund",
  stock: "Stock",
  etf: "ETF",
  gold: "Gold",
  custom: "Other",
};

const inputClass =
  "h-11 w-full rounded-lg border border-white/12 bg-[#101010] px-3 text-sm font-normal text-(--color-accent) placeholder:text-white/35";
const buttonClass =
  "inline-flex min-h-10 items-center justify-center rounded-lg border border-white/12 px-4 text-sm font-medium text-(--color-accent) hover:bg-white/8 disabled:opacity-50";

export function dateInput(value = new Date()) {
  const date = new Date(value);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function Field({ label, children, className = "" }) {
  return (
    <label
      className={`grid min-w-0 gap-1.5 text-sm font-medium text-(--color-accent) ${className}`}
    >
      <span>{label}</span>
      {children}
    </label>
  );
}

function Select({ value, options, onChange, placeholder }) {
  return (
    <span className="relative block">
      <select
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${inputClass} appearance-none pr-9 scheme-dark`}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {Object.entries(options).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
      <FiChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/55"
      />
    </span>
  );
}

function AssetSearch({ assetType, onSelect }) {
  const [text, setText] = useState("");
  const [term, setTerm] = useState("");
  const searchType = assetType === "gold" ? "etf" : assetType;
  useEffect(() => {
    const timer = setTimeout(() => setTerm(text.trim()), 250);
    return () => clearTimeout(timer);
  }, [text]);

  const search = useQuery({
    queryKey: ["asset-search", searchType, term],
    enabled: text.trim() === term && term.length >= 2,
    retry: false,
    staleTime: 60_000,
    queryFn: async ({ signal }) => {
      const query = new URLSearchParams({ assetType: searchType, q: term });
      const response = await fetch("/api/investments/search?" + query, {
        signal,
      });
      const data = await response.json();
      if (!response.ok || data.error) throw new Error("Search unavailable");
      return data.results;
    },
  });
  const hasSearch = text.trim().length >= 2;
  const waiting = text.trim() !== term || search.isFetching;
  return (
    <div className="grid gap-2">
      <Field
        label={
          assetType === "mutual_fund" ? "Find a mutual fund" : "Find an asset"
        }
      >
        <span className="relative block">
          <FiSearch
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/45"
          />
          <input
            type="search"
            autoComplete="off"
            maxLength={80}
            className={`${inputClass} pl-9`}
            placeholder={
              assetType === "mutual_fund"
                ? "Fund name or scheme code"
                : "Name or ticker"
            }
            value={text}
            onChange={(event) => {
              setText(event.target.value);
            }}
          />
        </span>
      </Field>
      {hasSearch && (
        <div className="overflow-hidden rounded-lg border border-white/12 bg-[#101010]">
          {waiting || search.isError || !search.data?.length ? (
            <p role="status" className="px-3 py-2.5 text-sm text-white/65">
              {waiting
                ? "Searching…"
                : search.isError
                  ? "Search is unavailable. Enter the asset below."
                  : "No matches. Enter the asset below."}
            </p>
          ) : (
            <ul
              aria-label="Search results"
              className="max-h-48 divide-y divide-white/8 overflow-y-auto"
            >
              {search.data.map((asset) => (
                <li key={asset.symbol}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm text-(--color-accent) hover:bg-white/8"
                    onClick={() => {
                      onSelect(asset);
                      setText("");
                    }}
                  >
                    <span>{asset.name}</span>
                    <span className="shrink-0 text-xs text-white/55">
                      {asset.symbol}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default function InvestmentModal({
  user,
  investment,
  plan,
  saving,
  saveError,
  onClose,
  onSave,
}) {
  const dialogRef = useRef(null);
  const existing = investment ?? plan;
  const [form, setForm] = useState(() => ({
    assetType: existing?.assetType ?? "",
    name: existing?.name ?? "",
    symbol: existing?.symbol ?? "",
    purchaseDate: investment
      ? dateInput(investment.purchaseDate)
      : plan
        ? [plan.schedule.nextDate, dateInput()].sort()[0]
        : dateInput(),
    investedAmount: plan?.schedule.amount ?? existing?.investedAmount ?? "",
    buyPrice: investment?.buyPrice ?? null,
    units: investment?.units ?? "",
    manualCurrentValue: investment?.manualCurrentValue ?? "",
    notes: investment?.notes ?? "",
    frequency: investment?.schedule?.frequency ?? "",
    nextDate: investment?.schedule?.nextDate ?? "",
    recurringAmount: investment?.schedule?.amount ?? "",
  }));
  const [quoteEnabled, setQuoteEnabled] = useState(Boolean(plan?.symbol));
  const [error, setError] = useState("");
  const set = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const { assetType, purchaseDate } = form;
  const symbol = form.symbol.trim();
  const canQuote = Boolean(
    symbol && purchaseDate && assetType && assetType !== "custom",
  );
  const quote = useQuery({
    queryKey: ["historical-investment-price", assetType, symbol, purchaseDate],
    enabled: canQuote && quoteEnabled,
    retry: false,
    staleTime: 60_000,
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({
        symbol,
        assetType,
        date: purchaseDate,
      });
      const response = await fetch("/api/investments/prices?" + params, {
        signal,
      });
      if (!response.ok) throw new Error("Price unavailable");
      return response.json();
    },
  });

  const buyPrice =
    form.buyPrice ?? (quoteEnabled ? (quote.data?.historicalPrice ?? "") : "");
  const computedUnits =
    Number(buyPrice) > 0 && Number(form.investedAmount) > 0
      ? Number(form.investedAmount) / Number(buyPrice)
      : "";
  const units = form.units !== "" ? form.units : computedUnits;
  const defaultNextDate =
    form.frequency && purchaseDate
      ? nextPaymentDate(
          purchaseDate,
          form.frequency,
          Number(purchaseDate.slice(-2)),
        )
      : "";
  const nextDate = form.nextDate || defaultNextDate;

  function submit(event) {
    event.preventDefault();
    setError("");
    const numbers = [form.investedAmount, buyPrice, units].map(Number);
    const override =
      form.manualCurrentValue === "" ? null : Number(form.manualCurrentValue);
    if (
      !form.name.trim() ||
      numbers.some((value) => !Number.isFinite(value) || value <= 0) ||
      (override !== null && (!Number.isFinite(override) || override < 0))
    ) {
      setError(
        "Enter a name, a positive amount, price and units, and a valid current value if needed.",
      );
      return;
    }
    if (form.frequency && (!nextDate || nextDate <= purchaseDate)) {
      setError("Choose a next payment date after the purchase date.");
      return;
    }
    const previous = investment?.schedule;
    const recurringAmount = Number(
      form.recurringAmount === "" ? form.investedAmount : form.recurringAmount,
    );
    if (
      form.frequency &&
      (!Number.isFinite(recurringAmount) || recurringAmount < 0.01)
    ) {
      setError("Enter an amount for each recurring payment.");
      return;
    }
    const schedule = form.frequency
      ? {
          frequency: form.frequency,
          nextDate,
          amount: recurringAmount,
          dayOfMonth:
            previous?.nextDate === nextDate
              ? previous.dayOfMonth
              : Number((form.nextDate || purchaseDate).slice(-2)),
        }
      : null;
    const changedSchedule =
      previous?.frequency !== schedule?.frequency ||
      previous?.nextDate !== schedule?.nextDate ||
      previous?.amount !== schedule?.amount;
    onSave({
      ...(investment ? { _id: investment._id } : {}),
      ...(plan
        ? { installment: { planId: plan._id, dueDate: plan.schedule.nextDate } }
        : {}),
      ...(changedSchedule
        ? { schedule, expectedNextDate: previous?.nextDate ?? null }
        : {}),
      userId: user,
      name: form.name.trim(),
      symbol,
      assetType,
      investedAmount: numbers[0],
      buyPrice: numbers[1],
      units: numbers[2],
      purchaseDate: purchaseDate + "T12:00:00.000Z",
      manualCurrentValue: override,
      notes: form.notes.trim(),
    });
  }

  function selectAsset(asset) {
    setForm((current) => ({
      ...current,
      name: asset.name,
      symbol: asset.symbol,
      buyPrice: null,
      units: "",
    }));
    setQuoteEnabled(true);
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="investment-modal-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!saving) onClose();
      }}
      onClick={(event) => {
        if (!saving && event.target === event.currentTarget) onClose();
      }}
      className="m-auto max-h-none w-[calc(100%-1rem)] max-w-[40rem] overflow-visible rounded-2xl border border-white/15 bg-[#0a0a0a] p-0 text-(--color-accent) shadow-2xl backdrop:bg-black/75 backdrop:backdrop-blur-sm sm:w-[calc(100%-2rem)]"
    >
      <form
        onSubmit={submit}
        className="flex max-h-[calc(100dvh-1rem)] flex-col sm:max-h-[calc(100dvh-3rem)]"
      >
        <header className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-6">
          <h2
            id="investment-modal-title"
            className="font-grotesk text-xl font-semibold"
          >
            {plan
              ? "Record SIP payment"
              : investment
                ? "Edit investment"
                : "Add investment"}
          </h2>
          <button
            type="button"
            aria-label="Close"
            disabled={saving}
            onClick={onClose}
            className="grid size-9 place-items-center rounded-lg text-white/65 hover:bg-white/8 hover:text-white"
          >
            <FiX size={19} />
          </button>
        </header>

        <div className="min-h-0 space-y-5 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">
          {plan ? (
            <p className="text-sm text-white/70">
              {plan.name} · Scheduled for{" "}
              {formatPaymentDate(plan.schedule.nextDate)}
            </p>
          ) : (
            <fieldset className="space-y-3">
              <legend className="mb-2 text-sm font-semibold text-white/60">
                Asset
              </legend>
              <div className="grid items-start gap-3 sm:grid-cols-2">
                <Field
                  label="Asset type"
                  className={
                    !assetType || assetType === "custom" ? "sm:col-span-2" : ""
                  }
                >
                  <Select
                    value={assetType}
                    options={ASSET_TYPES}
                    placeholder="Choose asset type"
                    onChange={(value) => {
                      setForm((current) => ({
                        ...current,
                        assetType: value,
                        symbol: "",
                        buyPrice: null,
                        units: "",
                      }));
                      setQuoteEnabled(false);
                    }}
                  />
                </Field>
                {assetType && assetType !== "custom" && (
                  <AssetSearch
                    key={assetType}
                    assetType={assetType}
                    onSelect={selectAsset}
                  />
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="Name"
                  className={
                    assetType === "custom" || !assetType ? "sm:col-span-2" : ""
                  }
                >
                  <input
                    required
                    value={form.name}
                    onChange={(event) => set("name", event.target.value)}
                    className={inputClass}
                  />
                </Field>
                {assetType && assetType !== "custom" && (
                  <Field
                    label={
                      assetType === "mutual_fund"
                        ? "AMFI scheme code"
                        : "Ticker"
                    }
                  >
                    <input
                      value={form.symbol}
                      onChange={(event) => {
                        setForm((current) => ({
                          ...current,
                          symbol: event.target.value,
                          buyPrice: null,
                          units: "",
                        }));
                        setQuoteEnabled(false);
                      }}
                      className={inputClass}
                    />
                  </Field>
                )}
              </div>
            </fieldset>
          )}

          <fieldset className="space-y-3 border-t border-white/10 pt-3">
            <legend className="pr-2 text-sm font-semibold text-white/60">
              Purchase
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Amount (₹)">
                <input
                  required
                  type="number"
                  min="0.01"
                  step="any"
                  inputMode="decimal"
                  value={form.investedAmount}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      investedAmount: event.target.value,
                      units: "",
                    }))
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Purchase date">
                <input
                  required
                  type="date"
                  max={dateInput()}
                  value={purchaseDate}
                  onChange={(event) => {
                    const value = event.target.value;
                    setForm((current) => ({
                      ...current,
                      purchaseDate: value,
                      buyPrice: current.symbol ? null : current.buyPrice,
                      units: current.symbol ? "" : current.units,
                    }));
                    setQuoteEnabled(true);
                  }}
                  className={`${inputClass} scheme-dark`}
                />
              </Field>
              <Field label="Price per unit (₹)">
                <input
                  required
                  type="number"
                  min="0.00000001"
                  step="any"
                  inputMode="decimal"
                  value={buyPrice}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      buyPrice: event.target.value,
                      units: "",
                    }))
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Units">
                <input
                  type="number"
                  min="0.00000001"
                  step="any"
                  inputMode="decimal"
                  value={form.units}
                  placeholder={
                    computedUnits === ""
                      ? ""
                      : Number(computedUnits.toPrecision(8)).toString()
                  }
                  onChange={(event) => set("units", event.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>
            {canQuote && (
              <div className="flex flex-wrap items-center gap-2 text-xs text-white/65">
                <button
                  type="button"
                  disabled={quote.isFetching}
                  className="text-(--color-primary) underline underline-offset-4 disabled:opacity-60"
                  onClick={() => {
                    setForm((current) => ({
                      ...current,
                      buyPrice: null,
                      units: "",
                    }));
                    setQuoteEnabled(true);
                    if (quoteEnabled) quote.refetch();
                  }}
                >
                  Look up price
                </button>
                {quoteEnabled && (
                  <span role="status">
                    {quote.isFetching
                      ? "Looking up price…"
                      : quote.data?.historicalDate
                        ? `Quote date: ${formatPaymentDate(quote.data.historicalDate)}`
                        : "No quote for this date. Enter the price on your statement."}
                  </span>
                )}
              </div>
            )}
          </fieldset>

          {!plan && (
            <fieldset className="space-y-3 border-t border-white/10 pt-3">
              <legend className="pr-2 text-sm font-semibold text-white/60">
                Schedule
              </legend>
              <div
                className="flex w-fit rounded-lg border border-white/12 p-1"
                role="group"
                aria-label="Payment type"
              >
                {[
                  ["", "One time"],
                  ["monthly", "Recurring / SIP"],
                ].map(([value, label]) => {
                  const selected = Boolean(value) === Boolean(form.frequency);
                  return (
                    <button
                      key={label}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => {
                        if (!selected)
                          setForm((current) => ({
                            ...current,
                            frequency: value,
                            nextDate: "",
                          }));
                      }}
                      className={`rounded-md px-3 py-2 text-sm ${selected ? "bg-white/12 text-(--color-accent)" : "text-white/65 hover:text-(--color-accent)"}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              {form.frequency && (
                <>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field label="Repeat">
                      <Select
                        value={form.frequency}
                        options={FREQUENCIES}
                        onChange={(value) => set("frequency", value)}
                      />
                    </Field>
                    <Field label="Next payment">
                      <input
                        required
                        type="date"
                        value={nextDate}
                        onChange={(event) =>
                          set("nextDate", event.target.value)
                        }
                        className={`${inputClass} scheme-dark`}
                      />
                    </Field>
                    <Field label="Amount per payment (₹)">
                      <input
                        type="number"
                        min="0.01"
                        step="any"
                        inputMode="decimal"
                        value={form.recurringAmount}
                        placeholder={String(form.investedAmount)}
                        onChange={(event) =>
                          set("recurringAmount", event.target.value)
                        }
                        className={inputClass}
                      />
                    </Field>
                  </div>
                  <p className="text-xs text-white/65">
                    Record each payment when it goes through.
                  </p>
                </>
              )}
            </fieldset>
          )}

          <details className="border-t border-white/10 pt-3">
            <summary className="cursor-pointer text-sm font-medium text-white/65">
              Notes and manual value
            </summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Notes">
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(event) => set("notes", event.target.value)}
                  className={`${inputClass} h-auto min-h-16 py-2`}
                />
              </Field>
              <Field label="Current value if no quote (₹)">
                <input
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={form.manualCurrentValue}
                  onChange={(event) =>
                    set("manualCurrentValue", event.target.value)
                  }
                  className={inputClass}
                />
              </Field>
            </div>
          </details>
        </div>

        <footer className="space-y-3 border-t border-white/10 px-4 py-4 sm:px-6">
          {(error || saveError) && (
            <p role="alert" className="text-sm text-red-300">
              {error || saveError}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className={buttonClass}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="min-h-10 rounded-lg bg-(--color-primary) px-4 text-sm font-semibold text-(--color-dark) hover:bg-(--color-secondary) disabled:opacity-50"
            >
              {saving
                ? "Saving…"
                : plan
                  ? "Record payment"
                  : investment
                    ? "Save changes"
                    : "Add investment"}
            </button>
          </div>
        </footer>
      </form>
    </dialog>
  );
}

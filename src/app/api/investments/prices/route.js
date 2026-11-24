import { z } from "zod";

export const runtime = "nodejs";

const CACHE_TTL_MS = 10 * 60 * 1000;
const priceCache = globalThis.investmentPriceCache || new Map();
globalThis.investmentPriceCache = priceCache;

const Query = z.object({
  symbol: z.string().trim().min(1),
  assetType: z.enum(["etf", "stock", "mutual_fund", "gold", "custom"]),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  fallbackPrice: z.coerce.number().nonnegative().optional(),
});

function nearestRecord(records, targetDate) {
  if (!targetDate || !records.length) return null;
  const target = Date.parse(`${targetDate}T00:00:00Z`);
  return records.reduce((best, record) => {
    const distance = Math.abs(Date.parse(`${record.date}T00:00:00Z`) - target);
    return !best || distance < best.distance ? { ...record, distance } : best;
  }, null);
}

async function fetchYahoo(symbol, date) {
  const encoded = encodeURIComponent(symbol);
  const currentUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encoded}?range=1y&interval=1d`;
  const currentResponse = await fetch(currentUrl, {
    headers: { "User-Agent": "Mozilla/5.0 budget-portfolio/1.0" },
    next: { revalidate: 0 },
  });
  if (!currentResponse.ok) throw new Error("Yahoo Finance quote unavailable");
  const payload = await currentResponse.json();
  const result = payload?.chart?.result?.[0];
  if (!result) throw new Error("Yahoo Finance returned no quote");
  const quotes = result.indicators?.quote?.[0]?.close || [];
  const timestamps = result.timestamp || [];
  const rows = timestamps
    .map((timestamp, index) => ({
      date: new Date(timestamp * 1000).toISOString().slice(0, 10),
      close: quotes[index],
    }))
    .filter((row) => Number.isFinite(row.close));
  let historicalRows = rows;
  if (
    date &&
    rows.length &&
    Date.parse(`${date}T00:00:00Z`) < Date.parse(`${rows[0].date}T00:00:00Z`)
  ) {
    historicalRows = [];
    const target = Date.parse(`${date}T00:00:00Z`);
    const period1 = Math.floor(target / 1000) - 4 * 24 * 60 * 60;
    const period2 = Math.floor(target / 1000) + 5 * 24 * 60 * 60;
    const historyResponse = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encoded}?period1=${period1}&period2=${period2}&interval=1d`,
      {
        headers: { "User-Agent": "Mozilla/5.0 budget-portfolio/1.0" },
        next: { revalidate: 0 },
      },
    );
    if (historyResponse.ok) {
      const historyPayload = await historyResponse.json();
      const history = historyPayload?.chart?.result?.[0];
      const historyQuotes = history?.indicators?.quote?.[0]?.close || [];
      historicalRows = (history?.timestamp || [])
        .map((timestamp, index) => ({
          date: new Date(timestamp * 1000).toISOString().slice(0, 10),
          close: historyQuotes[index],
        }))
        .filter((row) => Number.isFinite(row.close));
    }
  }
  const historical = nearestRecord(historicalRows, date);
  return {
    currentPrice: result.meta?.regularMarketPrice ?? rows.at(-1)?.close ?? null,
    historicalPrice: historical?.close ?? null,
    historicalDate: historical?.date ?? null,
    currency: result.meta?.currency || "INR",
  };
}

async function fetchMutualFund(schemeCode, date) {
  const response = await fetch(
    `https://api.mfapi.in/mf/${encodeURIComponent(schemeCode)}`,
    {
      next: { revalidate: 0 },
    },
  );
  if (!response.ok) throw new Error("AMFI NAV unavailable");
  const payload = await response.json();
  const records = (payload?.data || [])
    .map((row) => ({
      date: row.date?.split("-").reverse().join("-"),
      nav: Number(row.nav),
    }))
    .filter((row) => row.date && Number.isFinite(row.nav));
  const historical = nearestRecord(
    records.map((row) => ({ date: row.date, close: row.nav })),
    date,
  );
  return {
    currentPrice: records[0]?.nav ?? null,
    historicalPrice: historical?.close ?? null,
    historicalDate: historical?.date ?? null,
    currency: "INR",
  };
}

export async function GET(req) {
  const params = new URL(req.url).searchParams;
  const parsed = Query.safeParse(Object.fromEntries(params.entries()));
  if (!parsed.success) {
    return Response.json(
      { error: "Valid symbol and assetType are required" },
      { status: 400 },
    );
  }
  const { symbol, assetType, date, fallbackPrice } = parsed.data;
  const cacheKey = `${assetType}:${symbol}:${date || "latest"}:${fallbackPrice ?? ""}`;
  const cached = priceCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now())
    return Response.json(cached.value);

  let value;
  try {
    value =
      assetType === "custom"
        ? {
            currentPrice: fallbackPrice ?? null,
            historicalPrice: fallbackPrice ?? null,
            historicalDate: date || null,
            currency: "INR",
            manual: true,
          }
        : assetType === "mutual_fund"
          ? await fetchMutualFund(symbol, date)
          : await fetchYahoo(symbol, date);
    if (value.currentPrice == null && fallbackPrice != null) {
      value.currentPrice = fallbackPrice;
      value.manual = true;
    }
    if (value.historicalPrice == null && fallbackPrice != null) {
      value.historicalPrice = fallbackPrice;
      value.manual = true;
    }
  } catch (error) {
    value = {
      currentPrice: fallbackPrice ?? null,
      historicalPrice: fallbackPrice ?? null,
      historicalDate: fallbackPrice != null ? date || null : null,
      currency: "INR",
      manual: fallbackPrice != null,
      warning: "Live pricing is temporarily unavailable.",
    };
  }

  priceCache.set(cacheKey, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return Response.json(value);
}

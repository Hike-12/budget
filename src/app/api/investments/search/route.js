import { z } from "zod";

const SearchQuery = z.object({
  q: z.string().trim().min(2).max(80),
  assetType: z.enum(["stock", "etf", "mutual_fund"]).default("stock"),
});

export async function GET(req) {
  const parsed = SearchQuery.safeParse(
    Object.fromEntries(new URL(req.url).searchParams.entries()),
  );
  if (!parsed.success) return Response.json({ results: [] });
  const { q, assetType } = parsed.data;
  try {
    if (assetType === "mutual_fund") {
      const response = await fetch(
        `https://api.mfapi.in/mf/search?q=${encodeURIComponent(q)}`,
        { next: { revalidate: 300 } },
      );
      if (!response.ok) throw new Error("AMFI search unavailable");
      const results = (await response.json()).slice(0, 8).map((fund) => ({
        name: fund.schemeName,
        symbol: String(fund.schemeCode),
        assetType,
      }));
      return Response.json({ results });
    }

    const response = await fetch(
      `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=8&newsCount=0`,
      {
        headers: { "User-Agent": "Mozilla/5.0 budget-portfolio/1.0" },
        next: { revalidate: 300 },
      },
    );
    if (!response.ok) throw new Error("Yahoo symbol search unavailable");
    const payload = await response.json();
    const results = (payload.quotes || [])
      .filter(
        (item) => ["EQUITY", "ETF"].includes(item.quoteType) && item.symbol,
      )
      .map((item) => ({
        name: item.longname || item.shortname || item.symbol,
        symbol: item.symbol,
        assetType: item.quoteType === "ETF" ? "etf" : "stock",
      }));
    return Response.json({ results });
  } catch {
    return Response.json(
      { results: [], error: "Search is temporarily unavailable" },
      { status: 200 },
    );
  }
}

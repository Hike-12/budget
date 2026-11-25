import { timingSafeEqual } from "node:crypto";
import { connectToDB } from "@/lib/mongodb";
import { postDueTransactions } from "@/lib/recurringTransactions";

export async function GET(req) {
  const secret = process.env.CRON_SECRET;
  const received = Buffer.from(req.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret ?? ""}`);
  if (
    !secret ||
    received.length !== expected.length ||
    !timingSafeEqual(received, expected)
  ) {
    return new Response(null, { status: 401 });
  }
  await connectToDB();
  return Response.json({ posted: await postDueTransactions() });
}

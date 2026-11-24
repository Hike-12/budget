import { z } from "zod";
import { connectToDB } from "@/lib/mongodb";
import Budget from "@/lib/Budget";
import Investment from "@/lib/Investment";

const InvestmentInput = z.object({
  userId: z.string().min(1),
  name: z.string().trim().min(1),
  assetType: z.enum(["etf", "stock", "mutual_fund", "gold", "custom"]),
  symbol: z.string().trim().optional().default(""),
  investedAmount: z.coerce.number().positive(),
  units: z.coerce.number().positive(),
  buyPrice: z.coerce.number().positive(),
  purchaseDate: z.coerce.date(),
  notes: z.string().optional().default(""),
  manualCurrentValue: z.coerce.number().nonnegative().optional(),
});

function normalizeUser(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export async function GET(req) {
  await connectToDB();
  const userId = normalizeUser(new URL(req.url).searchParams.get("user"));
  if (!userId)
    return Response.json({ error: "User required" }, { status: 400 });
  const investments = await Investment.find({ userId })
    .sort({ purchaseDate: -1 })
    .lean();
  return Response.json(investments);
}

export async function POST(req) {
  await connectToDB();
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = InvestmentInput.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const data = { ...parsed.data, userId: normalizeUser(parsed.data.userId) };
  const session = await Investment.startSession();
  let created;
  try {
    await session.withTransaction(async () => {
      const [investment] = await Investment.create([data], { session });
      const [linkedBudget] = await Budget.create(
        [
          {
            title: data.name,
            amount: data.investedAmount,
            type: "expense",
            category: "Investment",
            note: `Investment purchase${data.symbol ? ` · ${data.symbol}` : ""}`,
            createdAt: data.purchaseDate,
            updatedAt: new Date(),
            user: data.userId,
            status: "verified",
            source: "investment_bridge",
            linkedInvestmentId: investment._id,
          },
        ],
        { session },
      );
      investment.linkedBudgetId = linkedBudget._id;
      await investment.save({ session });
      created = investment.toObject();
    });
    return Response.json(created, { status: 201 });
  } catch (error) {
    console.error("POST /api/investments failed:", error);
    return Response.json(
      { error: "Unable to create investment" },
      { status: 500 },
    );
  } finally {
    await session.endSession();
  }
}

export async function PATCH(req) {
  await connectToDB();
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { id, userId: rawUser, ...changes } = body || {};
  const userId = normalizeUser(rawUser);
  if (!id || !userId) {
    return Response.json(
      { error: "Investment id and user required" },
      { status: 400 },
    );
  }
  const parsed = InvestmentInput.partial().safeParse({ ...changes, userId });
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.issues },
      { status: 400 },
    );
  }
  const session = await Investment.startSession();
  let updated;
  try {
    await session.withTransaction(async () => {
      const investment = await Investment.findOne({ _id: id, userId }).session(
        session,
      );
      if (!investment) return;
      Object.assign(investment, parsed.data);
      investment.userId = userId;
      await investment.save({ session });
      if (investment.linkedBudgetId) {
        await Budget.updateOne(
          { _id: investment.linkedBudgetId, user: userId },
          {
            $set: {
              title: investment.name,
              amount: investment.investedAmount,
              createdAt: investment.purchaseDate,
              updatedAt: new Date(),
              note: `Investment purchase${investment.symbol ? ` · ${investment.symbol}` : ""}`,
            },
          },
          { session },
        );
      }
      updated = investment.toObject();
    });
    if (!updated) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json(updated);
  } catch (error) {
    console.error("PATCH /api/investments failed:", error);
    return Response.json(
      { error: "Unable to update investment" },
      { status: 500 },
    );
  } finally {
    await session.endSession();
  }
}

export async function DELETE(req) {
  await connectToDB();
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const userId = normalizeUser(body?.userId);
  if (!body?.id || !userId) {
    return Response.json(
      { error: "Investment id and user required" },
      { status: 400 },
    );
  }
  const session = await Investment.startSession();
  try {
    let deleted = false;
    await session.withTransaction(async () => {
      const investment = await Investment.findOneAndDelete(
        { _id: body.id, userId },
        { session },
      );
      if (!investment) return;
      if (investment.linkedBudgetId) {
        await Budget.deleteOne(
          { _id: investment.linkedBudgetId, user: userId },
          { session },
        );
      }
      deleted = true;
    });
    if (!deleted) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/investments failed:", error);
    return Response.json(
      { error: "Unable to delete investment" },
      { status: 500 },
    );
  } finally {
    await session.endSession();
  }
}

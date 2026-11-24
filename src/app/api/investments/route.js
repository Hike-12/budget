import { z } from "zod";
import { connectToDB } from "@/lib/mongodb";
import Budget from "@/lib/Budget";
import Investment from "@/lib/Investment";
import { FREQUENCIES, nextPaymentDate } from "@/lib/investmentSchedule";

const ScheduleInput = z.object({
  frequency: z.enum(Object.keys(FREQUENCIES)),
  nextDate: z.iso.date(),
  dayOfMonth: z.number().int().min(1).max(31),
  amount: z.number().min(0.01),
});
const InvestmentInput = z.object({
  userId: z.string().trim().min(1),
  name: z.string().trim().min(1),
  assetType: z.enum(["etf", "stock", "mutual_fund", "gold", "custom"]),
  symbol: z.string().trim().optional().default(""),
  investedAmount: z.coerce.number().positive(),
  units: z.coerce.number().positive(),
  buyPrice: z.coerce.number().positive(),
  purchaseDate: z.coerce.date(),
  notes: z.string().optional().default(""),
  manualCurrentValue: z.number().nonnegative().nullable().optional(),
  schedule: ScheduleInput.nullable().optional(),
});

const NewInvestmentInput = InvestmentInput.extend({
  installment: z
    .object({
      planId: z.string().regex(/^[a-f0-9]{24}$/i),
      dueDate: z.iso.date(),
    })
    .optional(),
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
  const parsed = NewInvestmentInput.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const { installment, ...fields } = parsed.data;
  const data = { ...fields, userId: normalizeUser(fields.userId) };
  if (
    data.schedule &&
    data.schedule.nextDate <= data.purchaseDate.toISOString().slice(0, 10)
  ) {
    return Response.json(
      { error: "The next payment must be after the purchase date" },
      { status: 400 },
    );
  }
  const session = await Investment.startSession();
  let created;
  try {
    await session.withTransaction(async () => {
      created = undefined;
      let purchase = data;
      if (installment) {
        const plan = await Investment.findOne({
          _id: installment.planId,
          userId: data.userId,
          "schedule.nextDate": installment.dueDate,
        }).session(session);
        if (!plan) return;
        const { frequency, dayOfMonth } = plan.schedule;
        plan.schedule.nextDate = nextPaymentDate(
          installment.dueDate,
          frequency,
          dayOfMonth,
        );
        await plan.save({ session });
        purchase = {
          ...data,
          name: plan.name,
          assetType: plan.assetType,
          symbol: plan.symbol,
          schedule: null,
        };
      }
      const [investment] = await Investment.create([purchase], { session });
      const [linkedBudget] = await Budget.create(
        [
          {
            title: purchase.name,
            amount: purchase.investedAmount,
            type: "expense",
            category: "Investment",
            note: purchase.symbol || "Investment purchase",
            createdAt: purchase.purchaseDate,
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
    if (!created)
      return Response.json(
        { error: "The payment schedule changed. Refresh and try again." },
        { status: 409 },
      );
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
  const { id, userId: rawUser, expectedNextDate, ...changes } = body || {};
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
  let invalidDate;
  let scheduleChanged;
  try {
    await session.withTransaction(async () => {
      updated = undefined;
      invalidDate = false;
      scheduleChanged = false;
      const investment = await Investment.findOne({ _id: id, userId }).session(
        session,
      );
      if (!investment) return;
      scheduleChanged =
        expectedNextDate !== undefined &&
        (investment.schedule?.nextDate ?? null) !== expectedNextDate;
      if (scheduleChanged) return;
      const { schedule, purchaseDate } = parsed.data;
      const effectiveSchedule =
        schedule === undefined ? investment.schedule : schedule;
      const effectiveDate = purchaseDate ?? investment.purchaseDate;
      invalidDate =
        effectiveSchedule &&
        effectiveSchedule.nextDate <= effectiveDate.toISOString().slice(0, 10);
      if (invalidDate) return;
      for (const key of Object.keys(changes)) {
        if (Object.hasOwn(parsed.data, key))
          investment.set(key, parsed.data[key]);
      }
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
              note: investment.symbol || "Investment purchase",
            },
          },
          { session },
        );
      }
      updated = investment.toObject();
    });
    if (scheduleChanged)
      return Response.json(
        { error: "The payment schedule changed. Refresh and try again." },
        { status: 409 },
      );
    if (invalidDate)
      return Response.json(
        { error: "The next payment must be after the purchase date" },
        { status: 400 },
      );
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

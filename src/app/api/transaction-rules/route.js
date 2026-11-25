import { z } from "zod";
import Budget from "@/lib/Budget";
import TransactionRule from "@/lib/TransactionRule";
import { accountForRequest } from "@/lib/accountSession";
import { getCorsHeaders } from "@/lib/cors";
import { occurrenceId, transactionFields } from "@/lib/recurringTransactions";
import {
  calendarToday,
  scheduleStart,
  validCalendarDate,
} from "@/lib/transactionDates.mjs";

const fields = {
  title: z.string().trim().min(1).max(80),
  amount: z.number().positive().max(1e9),
  type: z.enum(["income", "expense"]),
  category: z.enum(Budget.schema.path("category").enumValues),
  note: z.string().trim().max(500),
};
const ruleInput = z.discriminatedUnion("kind", [
  z.object({ ...fields, kind: z.literal("quick") }),
  z.object({
    ...fields,
    kind: z.literal("recurring"),
    weekdays: z
      .array(z.number().int().min(0).max(6))
      .min(1)
      .max(7)
      .refine((days) => new Set(days).size === days.length),
    startDate: z
      .string()
      .refine((date) => validCalendarDate(date) && date <= "2100-12-31"),
    paused: z.boolean(),
  }),
]);
const objectId = z.string().regex(/^[0-9a-f]{24}$/i);
const requestId = z.string().regex(/^[a-z0-9-]{12,100}$/i);
const command = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("save"),
    id: objectId.optional(),
    requestId: requestId.optional(),
    rule: ruleInput,
  }),
  z.object({ action: z.literal("remove"), id: objectId }),
  z.object({
    action: z.literal("add"),
    id: objectId,
    requestId,
  }),
]);

function response(req, body, status = 200) {
  return Response.json(body, {
    status,
    headers: { ...getCorsHeaders(req), "Cache-Control": "no-store" },
  });
}

async function run(req, handle) {
  try {
    const user = await accountForRequest(req);
    if (!user)
      return response(
        req,
        { error: "Sign in to use saved transactions." },
        401,
      );
    return await handle(user);
  } catch (error) {
    console.error("Transaction rules request failed", error.name, error.code);
    return response(req, { error: "Could not finish. Try again." }, 500);
  }
}

export function GET(req) {
  return run(req, async (user) => {
    const kind = new URL(req.url).searchParams.get("kind");
    if (kind !== "quick" && kind !== "recurring")
      return response(req, { error: "Choose a transaction type." }, 400);
    const rules = await TransactionRule.find({ user, kind })
      .sort({ createdAt: 1 })
      .lean();
    return response(req, { rules, today: calendarToday() });
  });
}

export function POST(req) {
  return run(req, async (user) => {
    const result = command.safeParse(await req.json().catch(() => null));
    if (!result.success)
      return response(req, { error: "Check the transaction details." }, 400);
    const { action, id } = result.data;
    if (action === "remove") {
      const removed = await TransactionRule.findOneAndDelete({ _id: id, user });
      return removed
        ? response(req, { removed: true })
        : response(req, { error: "Transaction setup not found." }, 404);
    }

    if (action === "add") {
      const rule = await TransactionRule.findOne({
        _id: id,
        user,
        kind: "quick",
      }).lean();
      if (!rule)
        return response(req, { error: "Quick transaction not found." }, 404);
      const _id = occurrenceId(`quick:${user}:${id}:${result.data.requestId}`);
      const now = new Date();
      const budget = await Budget.findOneAndUpdate(
        { _id },
        {
          $setOnInsert: {
            ...transactionFields(rule),
            user,
            source: "quick",
            status: "verified",
            createdAt: now,
            updatedAt: now,
          },
        },
        { upsert: true, new: true, runValidators: true },
      ).lean();
      return response(req, { budget });
    }

    const input = result.data.rule;
    const filter = { _id: id, user, kind: input.kind };
    const previous = id ? await TransactionRule.findOne(filter).lean() : null;
    if (id && !previous)
      return response(req, { error: "Transaction setup not found." }, 404);
    const update = { ...input, user };
    if (input.kind === "recurring") {
      const today = calendarToday();
      const sameSchedule =
        previous &&
        !previous.paused &&
        !input.paused &&
        previous.startDate === input.startDate &&
        [...previous.weekdays].sort().join() ===
          [...input.weekdays].sort().join();
      update.nextDate = input.paused
        ? null
        : sameSchedule
          ? previous.nextDate
          : scheduleStart(
              input.startDate,
              today,
              previous?.lastDate,
              input.weekdays,
            );
    }
    if (!id) {
      if (!result.data.requestId)
        return response(req, { error: "Request ID required." }, 400);
      const _id = occurrenceId(`rule:${user}:${result.data.requestId}`);
      const rule = await TransactionRule.findOneAndUpdate(
        { _id },
        {
          $setOnInsert: {
            ...update,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        { new: true, upsert: true, runValidators: true, timestamps: false },
      ).lean();
      return response(req, { rule }, 201);
    }
    const rule = await TransactionRule.findOneAndUpdate(
      { ...filter, updatedAt: previous.updatedAt },
      { $set: update },
      { new: true, runValidators: true },
    ).lean();
    return rule
      ? response(req, { rule })
      : response(
          req,
          { error: "This setup changed. Refresh and try again." },
          409,
        );
  });
}

export function OPTIONS(req) {
  return new Response(null, { status: 204, headers: getCorsHeaders(req) });
}

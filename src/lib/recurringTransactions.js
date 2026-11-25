import { createHash } from "node:crypto";
import mongoose from "mongoose";
import Budget from "@/lib/Budget";
import TransactionRule from "@/lib/TransactionRule";
import {
  calendarToday,
  nextDay,
  nextScheduledDate,
} from "@/lib/transactionDates.mjs";

export function transactionFields(rule) {
  const { title, amount, type, category, note } = rule;
  return { title, amount, type, category, note };
}

export function occurrenceId(key) {
  return new mongoose.Types.ObjectId(
    createHash("sha256").update(key).digest("hex").slice(0, 24),
  );
}

async function postRule(id, today) {
  return mongoose.connection.transaction(async (session) => {
    const rule = await TransactionRule.findOne({
      _id: id,
      kind: "recurring",
      paused: false,
      nextDate: { $lte: today },
    }).session(session);
    if (!rule) return 0;

    const entries = [];
    let date = rule.nextDate;
    while (date <= today && entries.length < 32) {
      const _id = occurrenceId(`recurring:${rule.id}:${date}`);
      entries.push({
        updateOne: {
          filter: { _id },
          update: {
            $setOnInsert: {
              ...transactionFields(rule),
              user: rule.user,
              source: "recurring",
              status: "verified",
              createdAt: new Date(`${date}T06:30:00Z`),
              updatedAt: new Date(),
            },
          },
          upsert: true,
        },
      });
      rule.lastDate = date;
      date = nextScheduledDate(nextDay(date), rule.weekdays);
    }

    await Budget.bulkWrite(entries, { session });
    rule.nextDate = date;
    await rule.save({ session });
    return entries.length;
  });
}

export async function postDueTransactions(user) {
  const today = calendarToday();
  const filter = {
    kind: "recurring",
    paused: false,
    nextDate: { $lte: today },
    ...(user && { user }),
  };
  const due = await TransactionRule.find(filter)
    .sort({ nextDate: 1 })
    .select("_id")
    .lean()
    .cursor();
  let posted = 0;
  for await (const { _id } of due) posted += await postRule(_id, today);
  return posted;
}

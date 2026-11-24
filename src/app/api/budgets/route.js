import { connectToDB } from "@/lib/mongodb";
import Budget from "@/lib/Budget";
import TrashBudget from "@/lib/TrashBudget";
import { getCorsHeaders } from "@/lib/cors";
import { z } from "zod";

const BudgetPayloadSchema = z.object({
  title: z.string().min(1, "Title is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  type: z.enum(["income", "expense"]).catch("expense"),
  note: z.string().optional().nullable(),
  category: z.string().catch("miscellaneous"),
  createdAt: z.union([z.string(), z.date(), z.number()]).optional().nullable(),
  updatedAt: z.union([z.string(), z.date(), z.number()]).optional().nullable(),
  user: z.string().min(1, "User is required"),
  clientId: z.string().optional().nullable(),
  status: z.enum(["verified", "pending"]).optional(),
  source: z.enum(["manual", "sms_auto", "investment_bridge"]).optional(),
  upiRefId: z.string().optional().nullable(),
  rawSmsSnippet: z.string().optional().nullable(),
  linkedInvestmentId: z.string().optional().nullable(),
  date: z.union([z.string(), z.date(), z.number()]).optional().nullable(),
});

function normalizeUser(user) {
  return String(user || "")
    .trim()
    .toLowerCase();
}

function normalizeDate(value, fallback = new Date()) {
  if (!value) return fallback;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? fallback : d;
}

export async function GET(req) {
  const corsHeaders = getCorsHeaders(req);
  await connectToDB();
  const { searchParams } = new URL(req.url);
  const user = normalizeUser(searchParams.get("user"));
  if (!user)
    return Response.json(
      { error: "User required" },
      { status: 400, headers: corsHeaders },
    );

  const status = searchParams.get("status");
  const statusFilter =
    status === "pending"
      ? "pending"
      : status === "all"
        ? null
        : { $ne: "pending" };
  const query = { user: { $regex: new RegExp(`^${user}$`, "i") } };
  if (statusFilter) query.status = statusFilter;

  const data = await Budget.find(query).sort({ createdAt: -1 }).lean();

  return Response.json(data, { headers: corsHeaders });
}

export async function POST(req) {
  const corsHeaders = getCorsHeaders(req);
  await connectToDB();
  try {
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return Response.json(
        { error: "Invalid JSON" },
        { status: 400, headers: corsHeaders },
      );
    }

    const result = BudgetPayloadSchema.safeParse(body);
    if (!result.success) {
      return Response.json(
        { error: "Validation failed", details: result.error.errors },
        { status: 400, headers: corsHeaders },
      );
    }

    const {
      title,
      amount,
      type,
      note,
      category,
      createdAt,
      updatedAt,
      user: rawUser,
      clientId,
      status: requestedStatus,
      source: requestedSource,
      upiRefId,
      rawSmsSnippet,
      linkedInvestmentId,
      date,
    } = result.data;

    const user = normalizeUser(rawUser);
    if (!user) {
      return Response.json(
        { error: "User required" },
        { status: 400, headers: corsHeaders },
      );
    }

    const createdAtDate = normalizeDate(createdAt);
    const updatedAtDate = normalizeDate(updatedAt, createdAtDate);
    const source = requestedSource || "manual";
    const status =
      requestedStatus || (source === "sms_auto" ? "pending" : "verified");

    if (upiRefId) {
      const existing = await Budget.findOne({ upiRefId, user }).lean();
      if (existing) {
        return Response.json(
          { deduplicated: true, budget: existing },
          { status: 200, headers: corsHeaders },
        );
      }
    }

    const budgetFields = {
      title,
      amount,
      type,
      note,
      category,
      createdAt: normalizeDate(date, createdAtDate),
      updatedAt: updatedAtDate,
      user,
      status,
      source,
      ...(upiRefId ? { upiRefId } : {}),
      ...(rawSmsSnippet ? { rawSmsSnippet } : {}),
      ...(linkedInvestmentId ? { linkedInvestmentId } : {}),
    };

    // Upsert by (user, clientId) with database-level LWW guard.
    if (clientId) {
      let doc;
      try {
        doc = await Budget.findOneAndUpdate(
          {
            clientId,
            user: { $regex: new RegExp(`^${user}$`, "i") },
            $or: [
              { updatedAt: { $exists: false } },
              { updatedAt: { $lte: updatedAtDate } },
            ],
          },
          {
            $set: {
              ...budgetFields,
              clientId,
            },
          },
          { upsert: true, new: true, rawResult: false },
        ).lean();
      } catch (err) {
        if (err?.code === 11000) {
          doc = await Budget.findOne({
            clientId,
            user: { $regex: new RegExp(`^${user}$`, "i") },
          }).lean();
        } else {
          throw err;
        }
      }

      if (!doc) {
        doc = await Budget.findOne({
          clientId,
          user: { $regex: new RegExp(`^${user}$`, "i") },
        }).lean();
      }

      return Response.json(doc, { headers: corsHeaders });
    }

    // Fallback (no clientId): create normally
    try {
      const doc = await Budget.create(budgetFields);
      return Response.json(doc, { headers: corsHeaders });
    } catch (error) {
      if (error?.code === 11000 && upiRefId) {
        const existing = await Budget.findOne({ upiRefId, user }).lean();
        if (existing) {
          return Response.json(
            { deduplicated: true, budget: existing },
            { status: 200, headers: corsHeaders },
          );
        }
      }
      throw error;
    }
  } catch (error) {
    console.error("POST /api/budgets failed:", error);
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500, headers: corsHeaders },
    );
  }
}

export async function PATCH(req) {
  const corsHeaders = getCorsHeaders(req);
  await connectToDB();

  let body;
  try {
    body = await req.json();
  } catch (e) {
    return Response.json(
      { error: "Invalid JSON" },
      { status: 400, headers: corsHeaders },
    );
  }

  const { id, ids, clientId, user: rawUser, ...rest } = body;

  // Validate the updates
  const patchResult = BudgetPayloadSchema.partial().safeParse(rest);
  if (!patchResult.success) {
    return Response.json(
      { error: "Validation failed", details: patchResult.error.errors },
      { status: 400, headers: corsHeaders },
    );
  }

  const user = normalizeUser(rawUser);
  if (!user)
    return Response.json(
      { error: "User required" },
      { status: 400, headers: corsHeaders },
    );

  const userRegex = { $regex: new RegExp(`^${user}$`, "i") };
  if (
    rest.status === "verified" &&
    (id || (Array.isArray(ids) && ids.length))
  ) {
    const updates = {};
    for (const key of ["title", "category", "amount", "type", "note"]) {
      if (patchResult.data[key] !== undefined)
        updates[key] = patchResult.data[key];
    }
    if (patchResult.data.date || patchResult.data.createdAt) {
      updates.createdAt = normalizeDate(
        patchResult.data.date || patchResult.data.createdAt,
      );
    }
    updates.status = "verified";
    updates.updatedAt = new Date();
    const target = ids?.length
      ? { _id: { $in: ids }, user: userRegex }
      : { _id: id, user: userRegex };
    if (ids?.length) {
      const result = await Budget.updateMany(target, { $set: updates });
      const budgets = await Budget.find(target).lean();
      return Response.json(
        { success: true, modifiedCount: result.modifiedCount, budgets },
        { headers: corsHeaders },
      );
    }
    const verified = await Budget.findOneAndUpdate(
      target,
      { $set: updates },
      { new: true },
    ).lean();
    if (!verified)
      return Response.json(
        { error: "Not found" },
        { status: 404, headers: corsHeaders },
      );
    return Response.json(verified, { headers: corsHeaders });
  }

  const query = id
    ? { _id: id, user: userRegex }
    : clientId
      ? { clientId, user: userRegex }
      : null;
  if (!query)
    return Response.json(
      { error: "id or clientId required" },
      { status: 400, headers: corsHeaders },
    );

  const update = { ...patchResult.data };
  if (update.date || update.createdAt)
    update.createdAt = normalizeDate(update.date || update.createdAt);
  delete update.date;

  const incomingUpdatedAt = normalizeDate(update.updatedAt);
  update.updatedAt = incomingUpdatedAt;

  let doc = await Budget.findOneAndUpdate(
    {
      ...query,
      $or: [
        { updatedAt: { $exists: false } },
        { updatedAt: { $lte: incomingUpdatedAt } },
      ],
    },
    update,
    { new: true },
  ).lean();
  if (!doc) {
    doc = await Budget.findOne(query).lean();
  }
  if (!doc)
    return Response.json(
      { error: "Not found" },
      { status: 404, headers: corsHeaders },
    );

  return Response.json(doc, { headers: corsHeaders });
}

export async function DELETE(req) {
  const corsHeaders = getCorsHeaders(req);
  await connectToDB();
  const { id, clientId, user: rawUser } = await req.json();
  const user = normalizeUser(rawUser);
  if (!user)
    return Response.json(
      { error: "User required" },
      { status: 400, headers: corsHeaders },
    );

  let budget = null;
  const userRegex = { $regex: new RegExp(`^${user}$`, "i") };

  if (id) {
    budget = await Budget.findOne({ _id: id, user: userRegex });
    if (!budget)
      budget = await Budget.findOne({ clientId: id, user: userRegex });
  } else if (clientId) {
    budget = await Budget.findOne({ clientId, user: userRegex });
  }

  if (budget) {
    // Move to trash before deleting
    await TrashBudget.create({ ...budget.toObject(), deletedAt: new Date() });
    await budget.deleteOne();
    return Response.json(
      { success: true, trashed: true },
      { headers: corsHeaders },
    );
  }

  return Response.json(
    { success: true, trashed: false },
    { headers: corsHeaders },
  );
}

export async function OPTIONS(req) {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(req),
  });
}

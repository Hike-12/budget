import { connectToDB } from "@/lib/mongodb";
import Budget from "@/lib/Budget";
import TrashBudget from "@/lib/TrashBudget";
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
});

const allowedOrigins = [
  "http://localhost:8081",
  "http://localhost:19006",
  "http://localhost:3000",
  "https://budget-tracker-hike.vercel.app",
  "https://budget-tracker-aliqyaan.vercel.app",
  process.env.WEB_ORIGIN,
].filter(Boolean);

function getCorsHeaders(req) {
  const origin = req.headers.get("origin") || "";
  const allowOrigin = allowedOrigins.includes(origin) ? origin : "*";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS,PATCH",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-Idempotency-Key",
    Vary: "Origin",
  };
}

function normalizeUser(user) {
  return String(user || "")
    .trim()
    .toLowerCase();
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function caseInsensitiveUser(user) {
  return { $regex: new RegExp(`^${escapeRegex(user)}$`, "i") };
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

  // Always use case-insensitive match so records saved with any username
  // casing (e.g. from the mobile app) are always returned together.
  const data = await Budget.find({ user: caseInsensitiveUser(user) })
    .sort({ createdAt: -1 })
    .lean();

  return Response.json(data, { headers: corsHeaders });
}

export async function POST(req) {
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

  // Upsert by (user, clientId) with database-level LWW guard.
  if (clientId) {
    let doc;
    try {
      doc = await Budget.findOneAndUpdate(
        {
          clientId,
          user,
          $or: [
            { updatedAt: { $exists: false } },
            { updatedAt: { $lte: updatedAtDate } },
          ],
        },
        {
          $set: {
            title,
            amount,
            type,
            note,
            category,
            createdAt: createdAtDate,
            updatedAt: updatedAtDate,
            user,
            clientId,
          },
        },
        { upsert: true, new: true, rawResult: false },
      ).lean();
    } catch (err) {
      if (err?.code === 11000) {
        doc = await Budget.findOne({
          clientId,
          user: caseInsensitiveUser(user),
        }).lean();
      } else {
        throw err;
      }
    }

    if (!doc) {
      doc = await Budget.findOne({
        clientId,
        user: caseInsensitiveUser(user),
      }).lean();
    }

    return Response.json(doc, { headers: corsHeaders });
  }

  // Fallback (no clientId): create normally
  const doc = await Budget.create({
    title,
    amount,
    type,
    note,
    category,
    createdAt: createdAtDate,
    updatedAt: updatedAtDate,
    user,
  });
  return Response.json(doc, { headers: corsHeaders });
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

  const { id, clientId, user: rawUser, ...rest } = body;

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

  const userQuery = caseInsensitiveUser(user);
  const query = id
    ? { _id: id, user: userQuery }
    : clientId
      ? { clientId, user: userQuery }
      : null;
  if (!query)
    return Response.json(
      { error: "id or clientId required" },
      { status: 400, headers: corsHeaders },
    );

  const update = { ...patchResult.data };
  if (update.createdAt) update.createdAt = normalizeDate(update.createdAt);

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

  // Always use case-insensitive user match to handle records saved with any casing.
  const caseInsensitive = caseInsensitiveUser(user);
  let budget = null;
  if (id) {
    budget = await Budget.findOne({ _id: id, user: caseInsensitive });
    if (!budget)
      budget = await Budget.findOne({ clientId: id, user: caseInsensitive });
  } else if (clientId) {
    budget = await Budget.findOne({ clientId, user: caseInsensitive });
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

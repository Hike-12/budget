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
  user: z.string().min(1, "User is required"),
  clientId: z.string().optional().nullable(),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
};

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

export async function GET(req) {
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

  // Idempotent create by (user, clientId)
  if (clientId) {
    const doc = await Budget.findOneAndUpdate(
      { user: caseInsensitiveUser(user), clientId },
      {
        $setOnInsert: {
          title,
          amount,
          type,
          note,
          category,
          createdAt: createdAt ? new Date(createdAt) : new Date(),
          user, // always write the normalized lowercase user
          clientId,
        },
      },
      { upsert: true, new: true },
    ).lean();
    return Response.json(doc, { headers: corsHeaders });
  }

  // Fallback (no clientId): create normally
  const doc = await Budget.create({
    title,
    amount,
    type,
    note,
    category,
    createdAt: createdAt ? new Date(createdAt) : undefined,
    user,
  });
  return Response.json(doc, { headers: corsHeaders });
}

export async function PATCH(req) {
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
  if (update.createdAt) update.createdAt = new Date(update.createdAt);

  const doc = await Budget.findOneAndUpdate(query, update, {
    new: true,
  }).lean();
  if (!doc)
    return Response.json(
      { error: "Not found" },
      { status: 404, headers: corsHeaders },
    );
  return Response.json(doc, { headers: corsHeaders });
}

export async function DELETE(req) {
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
    { error: "Not found" },
    { status: 404, headers: corsHeaders },
  );
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders,
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS,PATCH",
    },
  });
}

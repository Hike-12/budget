import { connectToDB } from "@/lib/mongodb";
import Budget from "@/lib/Budget";
import TrashBudget from "@/lib/TrashBudget";

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

  let data = await Budget.find({ user }).sort({ createdAt: -1 }).lean();
  // Fallback for legacy records stored with mixed-case usernames.
  if (data.length === 0) {
    data = await Budget.find({ user: caseInsensitiveUser(user) })
      .sort({ createdAt: -1 })
      .lean();
  }

  return Response.json(data, { headers: corsHeaders });
}

export async function POST(req) {
  await connectToDB();
  const {
    title,
    amount,
    type,
    note,
    category,
    createdAt,
    user: rawUser,
    clientId,
  } = await req.json();
  const user = normalizeUser(rawUser);
  if (!user)
    return Response.json(
      { error: "User required" },
      { status: 400, headers: corsHeaders },
    );

  // Idempotent create by (user, clientId)
  if (clientId) {
    const doc = await Budget.findOneAndUpdate(
      { user, clientId },
      {
        $setOnInsert: {
          title,
          amount,
          type,
          note,
          category,
          createdAt: createdAt ? new Date(createdAt) : new Date(),
          user,
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
  const { id, clientId, user: rawUser, ...rest } = await req.json();
  const user = normalizeUser(rawUser);
  if (!user)
    return Response.json(
      { error: "User required" },
      { status: 400, headers: corsHeaders },
    );

  const query = id ? { _id: id, user } : clientId ? { clientId, user } : null;
  if (!query)
    return Response.json(
      { error: "id or clientId required" },
      { status: 400, headers: corsHeaders },
    );

  const update = { ...rest };
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

  // Find the budget to delete
  let budget = null;
  if (id) {
    budget = await Budget.findOne({ _id: id, user });
    if (!budget) budget = await Budget.findOne({ clientId: id, user });
  } else if (clientId) {
    budget = await Budget.findOne({ clientId, user });
  }

  if (!budget) {
    const caseInsensitive = caseInsensitiveUser(user);
    if (id) {
      budget = await Budget.findOne({ _id: id, user: caseInsensitive });
      if (!budget)
        budget = await Budget.findOne({ clientId: id, user: caseInsensitive });
    } else if (clientId) {
      budget = await Budget.findOne({ clientId, user: caseInsensitive });
    }
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

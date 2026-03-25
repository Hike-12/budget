import { connectToDB } from "@/lib/mongodb";
import Budget from "@/lib/Budget";
import TrashBudget from "@/lib/TrashBudget";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function GET(req) {
  await connectToDB();
  const { searchParams } = new URL(req.url);
  const user = searchParams.get("user");
  if (!user) return Response.json({ error: "User required" }, { status: 400, headers: corsHeaders });
  const queryUser = { $regex: new RegExp(`^${user}$`, "i") };
  const data = await Budget.find({ user: queryUser }).sort({ createdAt: -1 }).lean();
  return Response.json(data, { headers: corsHeaders });
}

export async function POST(req) {
  await connectToDB();
  const { title, amount, type, note, category, createdAt, user, clientId } = await req.json();
  if (!user) return Response.json({ error: "User required" }, { status: 400, headers: corsHeaders });

  const queryUser = { $regex: new RegExp(`^${user}$`, "i") };

  // Idempotent create by (user, clientId)
  if (clientId) {
    const doc = await Budget.findOneAndUpdate(
      { user: queryUser, clientId },
      {
        $setOnInsert: {
          title, amount, type, note, category,
          createdAt: createdAt ? new Date(createdAt) : new Date(),
          user, clientId,
        },
      },
      { upsert: true, new: true }
    ).lean();
    return Response.json(doc, { headers: corsHeaders });
  }

  // Fallback (no clientId): create normally
  const doc = await Budget.create({
    title, amount, type, note, category,
    createdAt: createdAt ? new Date(createdAt) : undefined,
    user,
  });
  return Response.json(doc, { headers: corsHeaders });
}

export async function PATCH(req) {
  await connectToDB();
  const { id, clientId, user, ...rest } = await req.json();
  if (!user) return Response.json({ error: "User required" }, { status: 400, headers: corsHeaders });

  const queryUser = { $regex: new RegExp(`^${user}$`, "i") };
  const query = id ? { _id: id, user: queryUser } : clientId ? { clientId, user: queryUser } : null;
  if (!query) return Response.json({ error: "id or clientId required" }, { status: 400, headers: corsHeaders });

  const update = { ...rest };
  if (update.createdAt) update.createdAt = new Date(update.createdAt);

  const doc = await Budget.findOneAndUpdate(query, update, { new: true }).lean();
  if (!doc) return Response.json({ error: "Not found" }, { status: 404, headers: corsHeaders });
  return Response.json(doc, { headers: corsHeaders });
}

export async function DELETE(req) {
  await connectToDB();
  const { id, clientId, user } = await req.json();
  if (!user) return Response.json({ error: "User required" }, { status: 400, headers: corsHeaders });

  const queryUser = { $regex: new RegExp(`^${user}$`, "i") };

  // Find the budget to delete
  let budget = null;
  if (id) {
    budget = await Budget.findOne({ _id: id, user: queryUser });
    if (!budget) budget = await Budget.findOne({ clientId: id, user: queryUser });
  } else if (clientId) {
    budget = await Budget.findOne({ clientId, user: queryUser });
  }

  if (budget) {
    // Move to trash before deleting
    await TrashBudget.create({ ...budget.toObject(), deletedAt: new Date() });
    await budget.deleteOne();
    return Response.json({ success: true, trashed: true }, { headers: corsHeaders });
  }

  return Response.json({ error: "Not found" }, { status: 404, headers: corsHeaders });
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
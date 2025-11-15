import { connectToDB } from "@/lib/mongodb";
import Budget from "@/lib/Budget";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function GET(req) {
  await connectToDB();
  const { searchParams } = new URL(req.url);
  const user = searchParams.get("user");
  if (!user) return Response.json({ error: "User required" }, { status: 400, headers: corsHeaders });
  const data = await Budget.find({ user }).sort({ createdAt: -1 }).lean();
  return Response.json(data, { headers: corsHeaders });
}

export async function POST(req) {
  await connectToDB();
  const { title, amount, type, note, category, createdAt, user, clientId } = await req.json();
  if (!user) return Response.json({ error: "User required" }, { status: 400, headers: corsHeaders });

  // Idempotent create by (user, clientId)
  if (clientId) {
    const doc = await Budget.findOneAndUpdate(
      { user, clientId },
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

  const query = id ? { _id: id, user } : clientId ? { clientId, user } : null;
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

  // Try by _id first, then by clientId (for offline-added docs)
  let res = { deletedCount: 0 };
  if (id) {
    res = await Budget.deleteOne({ _id: id, user });
    if (res.deletedCount === 0) {
      res = await Budget.deleteOne({ clientId: id, user });
    }
  } else if (clientId) {
    res = await Budget.deleteOne({ clientId, user });
  } else {
    return Response.json({ error: "id or clientId required" }, { status: 400, headers: corsHeaders });
  }

  return Response.json({ success: true, deleted: res.deletedCount }, { headers: corsHeaders });
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
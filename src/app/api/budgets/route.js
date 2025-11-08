import { connectToDB } from "@/lib/mongodb";
import Budget from "@/lib/Budget";

export async function GET(req) {
  await connectToDB();
  const { searchParams } = new URL(req.url);
  const user = searchParams.get("user");
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
  };
  if (!user) {
    return Response.json([], { status: 400, headers });
  }
  const budgets = await Budget.find({ user }).sort({ createdAt: -1 });
  return Response.json(budgets, { headers });
}

export async function POST(req) {
  await connectToDB();
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
  };
  const { title, amount, type, note, category, createdAt, user } = await req.json();
  if (!user) {
    return Response.json({ error: "User required" }, { status: 400, headers });
  }
  const budget = await Budget.create({
    title,
    amount,
    type,
    note,
    category,
    createdAt: createdAt ? new Date(createdAt) : undefined,
    user,
  });
  return Response.json(budget, { headers });
}

export async function DELETE(req) {
  await connectToDB();
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
  };
  const { id, user } = await req.json();
  if (!user) {
    return Response.json({ error: "User required" }, { status: 400, headers });
  }
  await Budget.deleteOne({ _id: id, user });
  return Response.json({ success: true }, { headers });
}

export async function PATCH(req) {
  await connectToDB();
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
  };
  const { id, title, amount, type, note, category, createdAt, user } = await req.json();
  if (!user) {
    return Response.json({ error: "User required" }, { status: 400, headers });
  }
  const budget = await Budget.findOneAndUpdate(
    { _id: id, user },
    {
      title,
      amount,
      type,
      note,
      category,
      createdAt: createdAt ? new Date(createdAt) : undefined,
    },
    { new: true }
  );
  return Response.json(budget, { headers });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
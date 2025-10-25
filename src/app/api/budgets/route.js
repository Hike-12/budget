import { connectToDB } from "@/lib/mongodb";
import Budget from "@/lib/Budget";

export async function GET() {
  await connectToDB();
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
  };
  const budgets = await Budget.find().sort({ createdAt: -1 });
  return Response.json(budgets);
}

export async function POST(req) {
  await connectToDB();
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
  };
  const { title, amount, type, note, category, createdAt } = await req.json();
  const budget = await Budget.create({
    title,
    amount,
    type,
    note,
    category,
    createdAt: createdAt ? new Date(createdAt) : undefined,
  });
  return Response.json(budget);
}

export async function DELETE(req) {
  await connectToDB();
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
  };
  const { id } = await req.json();
  await Budget.findByIdAndDelete(id);
  return Response.json({ success: true });
}

export async function PATCH(req) {
  await connectToDB();
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
  };
  const { id, title, amount, type, note, category, createdAt } = await req.json();
  const budget = await Budget.findByIdAndUpdate(
    id,
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
  return Response.json(budget);
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
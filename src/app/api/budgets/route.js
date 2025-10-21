import { connectToDB } from "@/lib/mongodb";
import Budget from "@/lib/Budget";

export async function GET() {
  await connectToDB();
  const budgets = await Budget.find().sort({ createdAt: -1 });
  return Response.json(budgets);
}

export async function POST(req) {
  await connectToDB();
  const { title, amount, type, note } = await req.json();
  const budget = await Budget.create({ title, amount, type, note });
  return Response.json(budget);
}

export async function DELETE(req) {
  await connectToDB();
  const { id } = await req.json();
  await Budget.findByIdAndDelete(id);
  return Response.json({ success: true });
}
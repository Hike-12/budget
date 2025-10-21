import mongoose from "mongoose";

const BudgetSchema = new mongoose.Schema({
  title: String,
  amount: Number,
  type: { type: String, enum: ["income", "expense"], default: "expense" },
  note: String,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Budget || mongoose.model("Budget", BudgetSchema);
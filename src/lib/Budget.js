import mongoose from "mongoose";

const BudgetSchema = new mongoose.Schema({
  title: String,
  amount: Number,
  type: { type: String, enum: ["income", "expense"], default: "expense" },
  note: String,
  category: { type: String, enum: ["school friends", "college friends", "religion", "personal", "miscellaneous"], default: "miscellaneous" },
  createdAt: { type: Date, default: Date.now },
  user: String,
});

export default mongoose.models.Budget || mongoose.model("Budget", BudgetSchema);
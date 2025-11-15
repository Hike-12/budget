import mongoose from "mongoose";

const TrashBudgetSchema = new mongoose.Schema({
  // Copy all fields from Budget
  title: String,
  amount: Number,
  type: String,
  note: String,
  category: String,
  createdAt: Date,
  user: String,
  clientId: String,
  deletedAt: { type: Date, default: Date.now },
});

export default mongoose.models.TrashBudget || mongoose.model("TrashBudget", TrashBudgetSchema);
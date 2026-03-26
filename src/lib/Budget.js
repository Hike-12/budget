import mongoose from "mongoose";

const BudgetSchema = new mongoose.Schema({
  title: String,
  amount: Number,
  type: { type: String, enum: ["income", "expense"], default: "expense" },
  note: String,
  category: {
    type: String,
    enum: [
      "school friends",
      "college friends",
      "religion",
      "personal",
      "miscellaneous",
    ],
    default: "miscellaneous",
  },
  createdAt: { type: Date, default: Date.now },
  user: String,
  // NEW: stable client-generated id from the app
  clientId: { type: String, index: true },
});

BudgetSchema.index({ user: 1, clientId: 1 }, { unique: true, sparse: true });
BudgetSchema.index({ user: 1, createdAt: -1 });

export default mongoose.models.Budget || mongoose.model("Budget", BudgetSchema);

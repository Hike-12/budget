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
  updatedAt: { type: Date, default: Date.now },
  user: String,
  // stable client-generated id for offline-first dedup
  clientId: { type: String, default: null },
});

// Atomic dedup: only one document per (user, clientId) when clientId is set.
// partialFilterExpression replaces legacy sparse — more explicit and reliable.
BudgetSchema.index(
  { clientId: 1, user: 1 },
  {
    unique: true,
    partialFilterExpression: { clientId: { $type: "string" } },
  },
);
BudgetSchema.index({ user: 1, createdAt: -1 });

export default mongoose.models.Budget || mongoose.model("Budget", BudgetSchema);

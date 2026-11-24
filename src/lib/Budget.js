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
      "Food",
      "Travel",
      "Transport",
      "Shopping",
      "Bills",
      "Entertainment",
      "Health",
      "Other",
      "Investment",
    ],
    default: "miscellaneous",
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  user: String,
  // stable client-generated id for offline-first dedup
  clientId: { type: String, default: null },
  status: { type: String, enum: ["verified", "pending"], default: "verified" },
  source: {
    type: String,
    enum: ["manual", "sms_auto", "investment_bridge"],
    default: "manual",
  },
  upiRefId: { type: String, sparse: true },
  rawSmsSnippet: String,
  linkedInvestmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Investment",
  },
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
BudgetSchema.index(
  { user: 1, upiRefId: 1 },
  {
    unique: true,
    partialFilterExpression: { upiRefId: { $type: "string" } },
  },
);

export default mongoose.models.Budget || mongoose.model("Budget", BudgetSchema);

import mongoose from "mongoose";

const InvestmentSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    assetType: {
      type: String,
      enum: ["etf", "stock", "mutual_fund", "gold", "custom"],
      required: true,
    },
    symbol: { type: String, trim: true, default: "" },
    investedAmount: { type: Number, required: true, min: 0.01 },
    units: { type: Number, required: true, min: 0.00000001 },
    buyPrice: { type: Number, required: true, min: 0.00000001 },
    purchaseDate: { type: Date, required: true },
    linkedBudgetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Budget",
      default: null,
    },
    notes: { type: String, default: "" },
    manualCurrentValue: { type: Number, min: 0 },
  },
  { timestamps: true },
);

InvestmentSchema.index({ userId: 1, purchaseDate: -1 });

export default mongoose.models.Investment ||
  mongoose.model("Investment", InvestmentSchema);

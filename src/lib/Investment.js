import mongoose from "mongoose";
import { FREQUENCIES } from "./investmentSchedule";

const ScheduleSchema = new mongoose.Schema(
  {
    frequency: { type: String, enum: Object.keys(FREQUENCIES), required: true },
    nextDate: { type: String, required: true },
    dayOfMonth: { type: Number, min: 1, max: 31, required: true },
    amount: { type: Number, min: 0.01, required: true },
  },
  { _id: false },
);

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
    schedule: { type: ScheduleSchema, default: null },
  },
  { timestamps: true },
);

InvestmentSchema.index({ userId: 1, purchaseDate: -1 });

export default mongoose.models.Investment ||
  mongoose.model("Investment", InvestmentSchema);

import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    user: { type: String, required: true },
    kind: { type: String, required: true, enum: ["quick", "recurring"] },
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ["income", "expense"], required: true },
    category: { type: String, required: true },
    note: String,
    weekdays: { type: [Number], default: undefined },
    startDate: String,
    nextDate: String,
    lastDate: String,
    paused: Boolean,
  },
  { timestamps: true },
);

schema.index({ kind: 1, nextDate: 1 });
schema.index({ user: 1, kind: 1 });

export default mongoose.models.TransactionRule ||
  mongoose.model("TransactionRule", schema);

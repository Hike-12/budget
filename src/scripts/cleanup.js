import { connectToDB } from "@/lib/mongodb";
import TrashBudget from "@/lib/TrashBudget";

async function cleanup() {
  await connectToDB();
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const result = await TrashBudget.deleteMany({ deletedAt: { $lt: cutoff } });
  console.log(`Deleted ${result.deletedCount} old trashed budgets`);
}

cleanup().then(() => process.exit());
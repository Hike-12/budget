"use client";
import React, { useMemo } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { motion } from "framer-motion";

export default function AnalyticsTab({ budgets }) {
  // Aggregate data for Area Chart (Income vs Expense by Month)
  const monthlyData = useMemo(() => {
    const dataByMonth = {};
    budgets.forEach((b) => {
      const date = new Date(b.createdAt);
      const monthYear = date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
      if (!dataByMonth[monthYear]) {
        dataByMonth[monthYear] = {
          name: monthYear,
          income: 0,
          expense: 0,
          sortKey: date.getTime(),
        };
      }
      if (b.type === "income") {
        dataByMonth[monthYear].income += Number(b.amount);
      } else {
        dataByMonth[monthYear].expense += Number(b.amount);
      }
    });

    return Object.values(dataByMonth)
      .sort((a, b) => a.sortKey - b.sortKey)
      .slice(-6); // Only last 6 months for clean view
  }, [budgets]);

  // Aggregate data for Category Expenses
  const categoryData = useMemo(() => {
    const expenses = budgets.filter((b) => b.type === "expense");
    const dataByCategory = {};

    expenses.forEach((b) => {
      const cat = b.category || "Other";
      if (!dataByCategory[cat]) dataByCategory[cat] = 0;
      dataByCategory[cat] += Number(b.amount);
    });

    return Object.entries(dataByCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [budgets]);

  // General Pie Chart colors
  const PIE_COLORS = [
    "#34d399",
    "#f87171",
    "#60a5fa",
    "#fbbf24",
    "#a78bfa",
    "#f472b6",
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0e0e0e]/90 backdrop-blur-md border border-white/10 rounded-lg p-3 shadow-2xl">
          {label && (
            <p className="text-secondary/60 text-xs font-semibold mb-2 uppercase">
              {label}
            </p>
          )}
          <div className="flex flex-col gap-2">
            {payload.map((entry, index) => (
              <div key={index} className="flex items-center gap-3 text-sm">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-white/80 font-medium capitalize">
                  {entry.name}:
                </span>
                <span className="text-white font-bold ml-auto tracking-wide tabular-nums">
                  ₹{Number(entry.value).toLocaleString("en-IN")}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  if (!budgets || budgets.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-20 bg-[#0a0a0a] border border-white/5 rounded-2xl"
      >
        <p className="text-secondary/50 font-medium">
          Not enough data to showing analytics.
        </p>
        <p className="text-secondary/30 text-sm mt-1">
          Add some transactions to see your financial breakdown.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-12"
    >
      <style>{`
        .recharts-wrapper, .recharts-wrapper *, .recharts-surface, .recharts-surface * {
          outline: none !important;
        }
        .recharts-wrapper:focus-visible, .recharts-surface:focus-visible {
          outline: 2px solid rgba(255, 255, 255, 0.5) !important;
          border-radius: 8px;
        }
      `}</style>

      {/* 1. Cashflow Overview (Area Chart) */}
      <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors">
        <h3 className="font-grotesk text-accent/80 font-semibold mb-6 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
          Cashflow Overview (Last 6 Months)
        </h3>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={monthlyData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              style={{ outline: "none" }}
            >
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f87171" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke="rgba(255,255,255,0.2)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                dy={8}
              />
              <YAxis
                stroke="rgba(255,255,255,0.2)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                dx={-8}
                tickFormatter={(value) =>
                  `₹${value >= 1000 ? (value / 1000).toFixed(0) + "k" : value}`
                }
              />
              <RechartsTooltip
                content={<CustomTooltip />}
                cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 1 }}
              />
              <Legend
                iconType="circle"
                wrapperStyle={{
                  fontSize: "12px",
                  color: "rgba(255,255,255,0.6)",
                  paddingTop: "10px",
                }}
              />
              <Area
                type="monotone"
                dataKey="income"
                name="Income"
                stroke="#34d399"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorIncome)"
              />
              <Area
                type="monotone"
                dataKey="expense"
                name="Expense"
                stroke="#f87171"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorExpense)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Expenses by Category (Bar Chart) */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors">
        <h3 className="font-grotesk text-accent/80 font-semibold mb-6 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
          Expenses by Category
        </h3>
        <div className="h-[250px] w-full">
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryData}
                layout="vertical"
                margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
                style={{ outline: "none" }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.03)"
                  horizontal={true}
                  vertical={false}
                />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="rgba(255,255,255,0.4)"
                  fontSize={11}
                  interval={0}
                  tickLine={false}
                  axisLine={false}
                  width={80}
                />
                <RechartsTooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "rgba(255,255,255,0.02)" }}
                />
                <Bar
                  dataKey="value"
                  name="Amount"
                  fill="#fbbf24"
                  radius={[0, 4, 4, 0]}
                  barSize={24}
                >
                  {categoryData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-secondary/40 text-sm">
              No expense data available.
            </div>
          )}
        </div>
      </div>

      {/* 3. Expense Distribution (Pie Chart) */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors">
        <h3 className="font-grotesk text-accent/80 font-semibold mb-2 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
          Expense Distribution
        </h3>
        <div className="h-[280px] w-full relative">
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart style={{ outline: "none" }}>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {categoryData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{
                    fontSize: "11px",
                    color: "rgba(255,255,255,0.5)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-secondary/40 text-sm">
              No expense data available.
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

import HomePageClient from "@/components/HomePageClient";

export const metadata = {
  title: "Budget Tracker | Expense & Income Tracker",
  description:
    "Track daily expenses, monitor income, and build smarter financial habits with Budget Tracker.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    url: "/",
    title: "Budget Tracker | Expense & Income Tracker",
    description:
      "Track daily expenses, monitor income, and build smarter financial habits with Budget Tracker.",
    images: ["/logo.png"],
  },
  twitter: {
    title: "Budget Tracker | Expense & Income Tracker",
    description:
      "Track daily expenses, monitor income, and build smarter financial habits with Budget Tracker.",
    images: ["/logo.png"],
  },
};

export default function Home() {
  return <HomePageClient />;
}

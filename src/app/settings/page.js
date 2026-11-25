import Link from "next/link";
import { FiArrowLeft, FiCalendar, FiChevronRight, FiZap } from "react-icons/fi";

const rows = [
  { href: "/quick-transactions", title: "Quick transactions", icon: FiZap },
  {
    href: "/recurring-transactions",
    title: "Recurring transactions",
    icon: FiCalendar,
  },
];

export default function SettingsPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 pb-28 pt-28 sm:px-8">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-secondary hover:text-accent"
      >
        <FiArrowLeft /> Dashboard
      </Link>
      <h1 className="mb-7 font-grotesk text-3xl font-bold tracking-tight text-accent sm:text-4xl">
        Settings
      </h1>
      <div className="divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-[#101010]">
        {rows.map(({ href, title, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex min-h-16 items-center gap-3 px-4 text-sm font-semibold text-accent hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-secondary sm:px-5"
          >
            <Icon size={19} className="text-secondary" aria-hidden /> {title}{" "}
            <FiChevronRight className="ml-auto text-secondary" aria-hidden />
          </Link>
        ))}
      </div>
    </main>
  );
}

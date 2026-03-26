"use client";
import { FaPiggyBank } from "react-icons/fa";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

export default function Navbar() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [username, setUsername] = useState(null);

  useEffect(() => {
    // Initial read
    setUsername((localStorage.getItem("username") || "").toLowerCase().trim());
    router.prefetch("/login");

    // Re-sync whenever any component fires the custom auth-change event
    const onAuthChange = () =>
      setUsername(
        (localStorage.getItem("username") || "").toLowerCase().trim(),
      );
    window.addEventListener("auth-change", onAuthChange);
    return () => window.removeEventListener("auth-change", onAuthChange);
  }, [router]);

  const handleAction = () => {
    startTransition(() => {
      if (username) {
        localStorage.removeItem("username");
        window.dispatchEvent(new Event("auth-change"));
        setUsername(null);
      }
      router.replace("/login");
    });
  };

  return (
    <motion.nav
      initial={false}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.2 }}
      aria-label="Main navigation"
      className="fixed top-0 left-0 w-full z-50 bg-transparent backdrop-blur-md border-b border-white/10"
    >
      <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="flex items-center gap-3 font-grotesk text-2xl text-accent font-bold group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-md p-1 -ml-1"
        >
          <div className="bg-linear-to-tr from-primary to-secondary p-2 rounded-md group-hover:scale-110 transition-transform">
            <FaPiggyBank className="text-dark text-xl" />
          </div>
          <span className="tracking-tight">Budgetly</span>
        </Link>
        <button
          onClick={handleAction}
          disabled={isPending}
          aria-label={username ? "Logout" : "Login"}
          className="text-sm font-semibold bg-white/5 hover:bg-white/10 text-accent px-5 py-2.5 rounded-md backdrop-blur-md transition-all border border-white/10 hover:border-white/20 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          {username ? "Logout" : "Login"}
        </button>
      </div>
    </motion.nav>
  );
}

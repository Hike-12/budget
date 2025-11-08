"use client";
import { FaPiggyBank } from "react-icons/fa";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Navbar() {
  return (
    <motion.nav
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 w-full z-50 bg-dark/80 backdrop-blur"
    >
      <div className="max-w-4xl mx-auto flex items-center justify-between px-6 py-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-grotesk text-xl text-accent font-bold">
          <FaPiggyBank className="text-primary text-2xl" />
          Budgetly
        </Link>
        <Link href="/login" className="text-primary hover:text-secondary transition font-medium">
          Logout
        </Link>
      </div>
    </motion.nav>
  );
}
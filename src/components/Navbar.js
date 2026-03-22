"use client";
import { FaPiggyBank } from "react-icons/fa";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("username");
    router.push("/login");
  };

  return (
    <motion.nav
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 w-full z-50 bg-transparent backdrop-blur-md border-b border-white/10"
    >
      <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3 font-grotesk text-2xl text-accent font-bold group">
          <div className="bg-gradient-to-tr from-primary to-secondary p-2 rounded-md group-hover:scale-110 transition-transform">
            <FaPiggyBank className="text-dark text-xl" />
          </div>
          <span className="tracking-tight">Budgetly</span>
        </Link>
        <button 
          onClick={handleLogout}
          className="text-sm font-semibold bg-white/5 hover:bg-white/10 text-accent px-5 py-2.5 rounded-md backdrop-blur-md transition-all border border-white/10 hover:border-white/20 cursor-pointer"
        >
          Logout
        </button>
      </div>
    </motion.nav>
  );
}
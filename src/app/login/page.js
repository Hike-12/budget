"use client";
import { useState } from "react";
import { FiLock, FiArrowRight, FiUser, FiEye, FiEyeOff } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        localStorage.setItem("username", username);
        router.push("/dashboard");
      } else {
        setError("Invalid credentials");
      }
    } catch (err) {
      setError("An error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark pt-20 px-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[100px] pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md bg-dark/60 backdrop-blur-xl border border-white/10 rounded-md shadow-[0_0_40px_rgba(0,0,0,0.5)] p-0 m-4"
      >
        <div className="flex flex-col space-y-1.5 p-8 pb-6 border-b border-white/5">
          <div className="w-12 h-12 bg-primary/20 text-primary rounded-md flex items-center justify-center mb-4 border border-primary/30">
            <FiLock size={20} />
          </div>
          <h3 className="text-2xl font-grotesk font-bold text-[var(--color-accent)] tracking-tight">Access Account</h3>
          <p className="text-sm text-[var(--color-accent)] opacity-60">
            Enter your credentials to manage your finances
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 pt-6 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[var(--color-accent)]/80">Username</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-accent)]/40 pointer-events-none">
                 <FiUser size={18} />
              </span>
              <input
                type="text"
                placeholder="Enter your username"
                className="w-full bg-dark/50 border border-white/10 rounded-md pl-10 pr-4 py-2.5 text-[var(--color-accent)] text-sm placeholder:text-[var(--color-accent)]/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-[var(--color-accent)]/80">Password</label>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-accent)]/40 pointer-events-none">
                 <FiLock size={18} />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="w-full bg-dark/50 border border-white/10 rounded-md pl-10 pr-10 py-2.5 text-[var(--color-accent)] text-sm placeholder:text-[var(--color-accent)]/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-accent)]/40 hover:text-[var(--color-accent)]/80 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>
          
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-md px-3 py-2 flex items-center">
              {error}
            </motion.div>
          )}
          
          <button
            type="submit"
            disabled={isLoading}
            className="group mt-2 w-full flex items-center justify-center gap-2 bg-primary text-dark font-bold text-sm px-4 py-3 rounded-md hover:bg-white transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? "Signing In..." : "Sign In"}
            {!isLoading && <FiArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
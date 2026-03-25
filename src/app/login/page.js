"use client";
import { useState } from "react";
import { FiLock, FiArrowRight, FiUser, FiEye, FiEyeOff } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { z } from "zod";

const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(1, "Password is required"),
});

const signupSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // Validate using zod
    const schema = isLogin ? loginSchema : signupSchema;
    const dataToValidate = isLogin ? { username, password } : { username, password, confirmPassword };
    const parsed = schema.safeParse(dataToValidate);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0].message;
      setError(firstError);
      toast.error(firstError);
      return;
    }

    setIsLoading(true);
    const loadingToastId = toast.loading(isLogin ? "Signing in..." : "Creating account...");

    try {
      const endpoint = isLogin ? "/api/login" : "/api/signup";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(isLogin ? "Welcome back!" : "Account created successfully!", {
          id: loadingToastId,
        });
        localStorage.setItem("username", data.username || username);
        router.push("/dashboard");
      } else {
        setError(data.message || "Invalid credentials");
        toast.error(data.message || "Invalid credentials", {
          id: loadingToastId,
        });
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      toast.error("An error occurred. Please try again.", {
        id: loadingToastId,
      });
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError("");
    setUsername("");
    setPassword("");
    setConfirmPassword("");
  };

  const passwordValidations = [
    { label: "At least 6 characters", valid: password.length >= 6 },
  ];

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
          <h3 className="text-2xl font-grotesk font-bold text-[var(--color-accent)] tracking-tight">
            {isLogin ? "Access Account" : "Create Account"}
          </h3>
          <p className="text-sm text-[var(--color-accent)] opacity-60">
            {isLogin ? "Enter your credentials to manage your finances" : "Sign up to track and manage your budget"}
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-8 pt-6 flex flex-col gap-5">
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

          {!isLogin && (
            <div className="flex flex-col gap-1.5 px-1 py-1">
              {passwordValidations.map((req, i) => (
                <div key={i} className={`flex items-center gap-2 text-xs transition-colors duration-300 ${req.valid ? "text-primary" : "text-[var(--color-accent)]/40"}`}>
                  <div className={`w-3 h-3 flex items-center justify-center rounded-full border ${req.valid ? "border-primary bg-primary/20" : "border-[var(--color-accent)]/30 bg-dark/50"}`}>
                    {req.valid && <svg viewBox="0 0 24 24" fill="none" className="w-2 h-2 text-primary stroke-current stroke-2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                  </div>
                  <span>{req.label}</span>
                </div>
              ))}
            </div>
          )}

          {!isLogin && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between mt-1">
                <label className="text-sm font-medium text-[var(--color-accent)]/80">Confirm Password</label>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-accent)]/40 pointer-events-none">
                  <FiLock size={18} />
                </span>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full bg-dark/50 border border-white/10 rounded-md pl-10 pr-10 py-2.5 text-[var(--color-accent)] text-sm placeholder:text-[var(--color-accent)]/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required={!isLogin}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-accent)]/40 hover:text-[var(--color-accent)]/80 transition-colors"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>
          )}

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-md px-3 py-2 flex items-center overflow-hidden"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={isLoading}
            className="group mt-2 w-full flex items-center justify-center gap-2 bg-primary text-dark font-bold text-sm px-4 py-3 rounded-md border border-primary hover:bg-transparent hover:text-primary transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (isLogin ? "Signing In..." : "Creating Account...") : (isLogin ? "Sign In" : "Sign Up")}
            {!isLoading && <FiArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
          </button>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={toggleMode}
              className="text-sm text-[var(--color-accent)]/60 hover:text-primary transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
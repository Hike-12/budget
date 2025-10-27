"use client";
import { useState } from "react";
import { FaLock } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";


export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    if (res.ok) {
      router.push("/dashboard");
    } else {
      setError("Invalid credentials");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark">
      <motion.form
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="bg-dark border border-primary rounded-xl shadow-xl p-8 w-full max-w-sm flex flex-col gap-6"
      >
        <div className="flex items-center gap-2 mb-2">
          <FaLock className="text-primary text-2xl" />
          <span className="font-grotesk text-2xl text-accent">Login</span>
        </div>
        <input
          type="text"
          placeholder="Username"
          className="bg-secondary/10 border border-secondary rounded px-4 py-2 text-accent focus:outline-none focus:border-primary"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="bg-secondary/10 border border-secondary rounded px-4 py-2 text-accent focus:outline-none focus:border-primary"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <button
          type="submit"
          className="bg-primary text-dark font-bold py-2 rounded hover:bg-secondary transition"
        >
          Sign In
        </button>
      </motion.form>
    </div>
  );
}
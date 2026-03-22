"use client";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { FaArrowRight } from "react-icons/fa";

export default function Home() {
  return (
    <div className="h-screen overflow-hidden flex flex-col justify-center items-center relative">
      <div className="absolute inset-0 z-0">
        <Image 
          src="/img2.jpg" 
          alt="Abstract Finance Background"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-dark/40" />
      </div>

      {/* Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-md mix-blend-screen pointer-events-none z-0" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 blur-[120px] rounded-md mix-blend-screen pointer-events-none z-0" />

      <main className="z-10 flex flex-col items-center text-center px-6 max-w-5xl mx-auto py-4 w-full mt-4">


        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl font-grotesk font-bold text-accent mb-6 leading-tight tracking-tight relative"
        >
          Master your money,<br/>
          <span className="bg-clip-text bg-gradient-to-r from-primary to-secondary">
            shape your future.
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-secondary/90 text-lg md:text-xl max-w-2xl mb-8"
        >
          A minimalist approach to tracking expenses, setting goals, and taking control of your financial life. Engineered for clarity, speed, and elegance.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 mb-4"
        >
          <Link href="/login" style={{ color: "var(--color-accent)" }} className="flex items-center justify-center gap-2 bg-dark/80 backdrop-blur-md border border-primary px-8 py-3 rounded-md font-bold text-lg hover:bg-primary transition-all hover:scale-105 hover:!text-dark">
            Start Tracking <FaArrowRight className="text-sm" />
          </Link>
          <Link href="/dashboard" style={{ color: "var(--color-accent)" }} className="flex items-center justify-center gap-2 bg-dark/60 backdrop-blur-xl border border-secondary/30 px-8 py-3 rounded-md font-bold text-lg hover:bg-dark/80 hover:border-secondary transition-all hover:scale-105">
            Go to Dashboard
          </Link>
        </motion.div>
      </main>


    </div>
  );
}
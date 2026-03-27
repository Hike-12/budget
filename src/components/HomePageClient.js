"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { FaArrowRight } from "react-icons/fa";
import bgDecor from "../../public/tree.png";

export default function HomePageClient() {
  return (
    <section
      className="relative min-h-svh overflow-hidden flex items-center justify-center lg:justify-start px-4 sm:px-6 lg:px-10 xl:pl-32 py-10"
      aria-labelledby="home-hero-title"
    >
      <div className="absolute inset-0 z-0">
        <Image
          src={bgDecor}
          alt="Tree Background"
          fill
          priority
          placeholder="blur"
          fetchPriority="high"
          sizes="100vw"
          className="object-cover object-[70%_center] sm:object-right opacity-[0.06] sm:opacity-20 lg:opacity-35 invert brightness-75 contrast-125 lg:translate-x-40 xl:translate-x-64"
        />
        <div className="absolute inset-0 bg-linear-to-r from-dark via-dark/85 to-dark/20 lg:to-transparent" />
        <div className="absolute inset-0 bg-dark/60" />
      </div>

      {/* Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-md mix-blend-screen pointer-events-none z-0" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 blur-[120px] rounded-md mix-blend-screen pointer-events-none z-0" />

      <div className="z-10 flex w-full max-w-5xl flex-col items-center lg:items-start text-center lg:text-left py-4 mt-8 sm:mt-10 lg:mt-12">
        <motion.h1
          id="home-hero-title"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-grotesk font-semibold text-accent mb-5 sm:mb-6 leading-[1.08] tracking-tight relative max-w-[16ch] sm:max-w-[18ch] lg:max-w-[20ch]"
        >
          Money doesn&apos;t grow on trees,
          <span className="block mt-1 bg-clip-text bg-linear-to-r from-primary to-secondary">
            but your savings can branch out.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-secondary/90 text-base sm:text-lg md:text-xl max-w-2xl mb-7 sm:mb-8"
        >
          Plant the seed of financial freedom today. Track your spending,
          nurture your budget, and watch your wealth flourish. No green thumb
          required.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex w-full max-w-md sm:max-w-none flex-col sm:flex-row gap-3 sm:gap-4 mb-2 sm:mb-4"
        >
          <a
            href="https://drive.google.com/drive/folders/1DR3EmfC-2j6YATuUB9t85dJ1KgdU3R3M?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Install Budgetly app APK"
            className="w-full sm:w-auto flex items-center justify-center gap-2 border border-accent/70 text-accent px-6 sm:px-8 py-3 rounded-md font-bold text-base sm:text-lg hover:bg-accent/10 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            Install App
          </a>
          <Link
            href="/login"
            aria-label="Start tracking by signing in"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-accent text-dark border border-accent/80 px-6 sm:px-8 py-3 rounded-md font-bold text-base sm:text-lg hover:bg-accent/90 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            Start Tracking <FaArrowRight className="text-sm" />
          </Link>
          <Link
            href="/dashboard"
            aria-label="Open dashboard"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-accent text-dark border border-accent/80 px-6 sm:px-8 py-3 rounded-md font-bold text-base sm:text-lg hover:bg-accent/90 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            Go to Dashboard
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

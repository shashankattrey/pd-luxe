"use client";

import { motion } from "framer-motion";

export function WealthScore({ score }: { score: number }) {
  // Determine color based on score
  const getColor = (s: number) => {
    if (s < 40) return "#ef4444"; // Red
    if (s < 70) return "#f59e0b"; // Amber
    return "#10b981"; // Emerald
  };

  const color = getColor(score);
  const circumference = 2 * Math.PI * 45; // Radius is 45
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-32 h-32">
      <svg className="w-full h-full transform -rotate-90">
        {/* Background Circle */}
        <circle
          cx="64"
          cy="64"
          r="45"
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          className="text-white/5"
        />
        {/* Animated Progress Circle */}
        <motion.circle
          cx="64"
          cy="64"
          r="45"
          stroke={color}
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 8px ${color}40)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-2xl font-mono font-bold text-white"
        >
          {score}
        </motion.span>
        <span className="text-[8px] uppercase tracking-tighter text-white/30">
          Score
        </span>
      </div>
    </div>
  );
}

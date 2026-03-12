"use client";

import { motion } from "framer-motion";
import { IndianRupee } from "lucide-react";

interface MoneySliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export default function MoneySlider({
  value,
  onChange,
  min = 200000,
  max = 5000000,
  step = 50000,
}: MoneySliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="w-full space-y-8">
      {/* VALUE DISPLAY */}
      <motion.div
        key={value}
        initial={{ scale: 0.92, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col items-center gap-2"
      >
        <div className="flex items-center gap-2 text-4xl sm:text-5xl font-bold tracking-tight">
          <IndianRupee className="w-7 h-7 text-amber-400" />
          <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            {value.toLocaleString()}
          </span>
        </div>

        <p className="text-xs text-gray-400 tracking-wide">Annual Income</p>
      </motion.div>

      {/* SLIDER CONTAINER */}
      <div className="relative w-full">
        {/* GLOW BAR */}
        <div className="absolute inset-0 h-3 rounded-full bg-gray-800/60 backdrop-blur" />

        {/* PROGRESS BAR */}
        <div
          className="absolute h-3 rounded-full transition-all duration-200"
          style={{
            width: `${percentage}%`,
            background: "linear-gradient(90deg,#fbbf24,#f59e0b,#d97706)",
            boxShadow: "0 0 20px rgba(251,191,36,0.4)",
          }}
        />

        {/* RANGE INPUT */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="relative w-full appearance-none bg-transparent h-3 cursor-pointer"
        />

        {/* FLOATING VALUE BADGE */}
        <motion.div
          animate={{ left: `${percentage}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="absolute -top-10 -translate-x-1/2"
        >
          <div className="px-3 py-1 text-xs rounded-full bg-amber-400 text-black font-semibold shadow-lg">
            ₹{(value / 100000).toFixed(1)}L
          </div>
        </motion.div>
      </div>

      {/* RANGE LABELS */}
      <div className="flex justify-between text-xs text-gray-400 font-medium">
        <span>₹{(min / 100000).toFixed(0)}L</span>
        <span>₹{(max / 100000).toFixed(0)}L</span>
      </div>
    </div>
  );
}

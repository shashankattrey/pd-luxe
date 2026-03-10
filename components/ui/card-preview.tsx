"use client";

import Tilt from "react-parallax-tilt";

export default function CardPreview({ card }: any) {
  return (
    <Tilt
      tiltMaxAngleX={10}
      tiltMaxAngleY={10}
      perspective={1200}
      scale={1.03}
      transitionSpeed={1200}
      gyroscope={true}
      className="w-full max-w-sm"
    >
      <div
        className={`relative overflow-hidden rounded-3xl p-6 text-white 
        bg-gradient-to-br ${card.imageGradient}
        shadow-[0_30px_100px_rgba(0,0,0,0.7)]`}
      >
        {/* Shine Effect */}
        <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.2),transparent)] opacity-40" />

        {/* Bank + Network */}
        <div className="flex justify-between items-center mb-10">
          <span className="text-xs tracking-widest opacity-80">
            {card.bank}
          </span>

          <span className="text-xs tracking-widest opacity-80">
            {card.network}
          </span>
        </div>

        {/* Chip */}
        <div className="w-12 h-9 bg-yellow-400/90 rounded-md mb-8 shadow-inner" />

        {/* Card Number */}
        <div className="text-lg md:text-xl font-mono tracking-[0.3em] mb-6">
          •••• •••• •••• 4821
        </div>

        {/* Card Holder + Card Name */}
        <div className="flex justify-between items-end">
          <div>
            <p className="text-[10px] opacity-60 uppercase">Card Holder</p>
            <p className="text-sm font-semibold">You</p>
          </div>

          <p className="text-sm md:text-base font-serif font-semibold text-right max-w-[140px]">
            {card.name}
          </p>
        </div>
      </div>
    </Tilt>
  );
}

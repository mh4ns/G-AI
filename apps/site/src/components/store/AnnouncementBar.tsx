"use client";

import React, { useState, useEffect } from "react";

const STATEMENTS = [
  "Complimentary worldwide shipping on orders over $100",
  "Series 01: Pilates apparatus & compression knitwear now available",
  "Engineered for kinetic precision with on-device camera tracking",
  "Welcome gift: 15% off your inaugural order with code WELCOME15",
];

export const AnnouncementBar: React.FC = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % STATEMENTS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-pitch text-ecru-100 h-9 px-4 flex items-center justify-center text-[11px] font-mono tracking-wider border-b border-white/10 select-none relative z-50">
      <div className="text-center truncate max-w-2xl transition-opacity duration-700 ease-out">
        <span>{STATEMENTS[index]}</span>
      </div>
    </div>
  );
};

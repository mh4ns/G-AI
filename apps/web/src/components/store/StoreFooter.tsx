"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";

export const StoreFooter: React.FC = () => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <footer className="bg-pitch text-ecru-100 pt-16 pb-12 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Newsletter Inscription */}
        <div className="pb-12 border-b border-white/10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-6 space-y-2">
            <span className="text-[11px] font-mono tracking-widest text-ecru-300 uppercase">
              Field Notes & Edition Drops
            </span>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Stay informed on limited kinetic releases.
            </h3>
            <p className="text-xs text-stone-400 max-w-md leading-relaxed">
              We release small-batch garments and apparatus calibrated for home studio practice. Subscribers receive advance access and 15% off their inaugural order.
            </p>
          </div>

          <div className="lg:col-span-6">
            {subscribed ? (
              <div className="p-3.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-emerald-300 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Subscription confirmed. Use code WELCOME15 at checkout.</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="flex-1 px-4 py-3 rounded-full bg-white/5 border border-white/15 text-white placeholder-stone-500 text-xs font-mono focus:outline-none focus:border-white transition-colors"
                />
                <button
                  type="submit"
                  className="px-6 py-3 rounded-full bg-white text-pitch hover:bg-ecru-200 text-xs font-mono font-semibold transition-colors shrink-0"
                >
                  Subscribe
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Index Links */}
        <div className="py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-xs font-mono">
          <div>
            <h4 className="text-white text-[11px] uppercase tracking-wider mb-3">
              Divisions
            </h4>
            <ul className="space-y-2 text-stone-400">
              <li><a href="#catalog" className="hover:text-white transition-colors">Series 01 Knitwear</a></li>
              <li><a href="#apparatus" className="hover:text-white transition-colors">Pilates Apparatus</a></li>
              <li><a href="#disciplines" className="hover:text-white transition-colors">Movement Disciplines</a></li>
              <li><a href="#pigments" className="hover:text-white transition-colors">Pigment Studies</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-[11px] uppercase tracking-wider mb-3">
              App Ecosystem
            </h4>
            <ul className="space-y-2 text-stone-400">
              <li><Link href="/quiz" className="hover:text-white transition-colors">28-Day Movement Plan</Link></li>
              <li><Link href="/today" className="hover:text-white transition-colors">Daily Practice Hub</Link></li>
              <li><a href="#" className="hover:text-white transition-colors">On-Device Pose Engine</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Metabolic Calculator</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-[11px] uppercase tracking-wider mb-3">
              Assistance
            </h4>
            <ul className="space-y-2 text-stone-400">
              <li><a href="#" className="hover:text-white transition-colors">Size & Fit Calibration</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Apparatus Care & Maintenance</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Returns & Exchange Portal</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Studio Wholesale Program</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-[11px] uppercase tracking-wider mb-3">
              Standards
            </h4>
            <p className="text-stone-400 text-[11px] leading-relaxed">
              Every garment and apparatus is tested for biomechanical durability and zero optical reflection under studio illumination.
            </p>
          </div>
        </div>

        {/* Bottom Attribution */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-stone-500 gap-4">
          <p>© 2026 G—AI Movement Goods Division. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-stone-300">Terms of Service</a>
            <a href="#" className="hover:text-stone-300">Privacy Policy</a>
            <a href="#" className="hover:text-stone-300">Carbon Neutrality</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

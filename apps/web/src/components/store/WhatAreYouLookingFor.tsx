"use client";

import React from "react";
import { ArrowUpRight } from "lucide-react";
import { CATEGORY_GRID_ITEMS } from "@/data/mockStoreData";
import Link from "next/link";

export const WhatAreYouLookingFor: React.FC = () => {
  return (
    <section className="py-12 sm:py-20 lg:py-24 bg-white border-b border-stone-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-stone-900">
            What Are You Looking For?
          </h2>
          <p className="text-stone-500 text-sm sm:text-base mt-2">
            Chọn danh mục để khám phá trang phục và dụng cụ phù hợp với bạn
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {CATEGORY_GRID_ITEMS.map((item, idx) => (
            <Link
              key={idx}
              href={item.link}
              className="group flex flex-col overflow-hidden rounded-2xl bg-stone-50 border border-stone-200/80 hover:border-stone-400/80 transition-all duration-300 hover:shadow-card"
            >
              {/* Image Container with Hover Scale */}
              <div className="relative aspect-[4/5] overflow-hidden bg-stone-200">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-stone-700 group-hover:bg-black group-hover:text-white transition-colors shadow-sm">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>

              {/* Text Info */}
              <div className="p-4 sm:p-5">
                <h3 className="font-bold text-stone-900 text-base sm:text-lg group-hover:text-[#FF6542] transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-stone-500 mt-1 line-clamp-1">
                  {item.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

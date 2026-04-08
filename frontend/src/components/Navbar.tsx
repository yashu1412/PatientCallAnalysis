"use client";

import React from "react";
import { motion } from "framer-motion";

const Navbar = () => {
  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 w-full bg-slate-900/50 backdrop-blur-xl border-b border-white/10 px-4 md:px-6 py-3 md:py-4"
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="text-white font-bold text-lg">D</span>
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
              Docstribe AI
            </h1>
            <p className="hidden sm:block text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
              Call Intelligence System
            </p>
          </div>
        </div>

        <div className="flex items-center">
          <div className="flex items-center space-x-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] md:text-xs font-medium text-green-400 whitespace-nowrap">AI Ready</span>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;

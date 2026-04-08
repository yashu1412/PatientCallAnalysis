"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, ChevronDown, ChevronRight, Terminal } from "lucide-react";
import { cn } from "@/utils/cn";

interface JSONViewerProps {
  data: any;
}

const JSONViewer = ({ data }: JSONViewerProps) => {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-800 transition-all duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-8 py-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-green-500/10 text-green-400 flex-shrink-0">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-white font-bold">Raw JSON Output</h4>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">System Diagnostics</p>
          </div>
        </div>
        <div className="flex items-center space-x-4 self-end sm:self-auto">
          <button
            onClick={handleCopy}
            className="p-2.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all flex items-center space-x-2 border border-slate-800"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            <span className="text-xs font-medium">{copied ? "Copied!" : "Copy JSON"}</span>
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all border border-slate-800"
          >
            {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-8 font-mono text-sm leading-relaxed overflow-x-auto max-h-[600px] custom-scrollbar-dark">
              <pre className="text-green-400">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default JSONViewer;

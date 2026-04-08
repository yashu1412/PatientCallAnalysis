"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Mic, FileText, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/utils/cn";

interface HeroSectionProps {
  onUpload: (file: File) => void;
  isUploading: boolean;
  status?: string;
}

const HeroSection = ({ onUpload, isUploading, status }: HeroSectionProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      onUpload(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      onUpload(files[0]);
    }
  };

  return (
    <section className="relative py-10 md:py-20 px-4 md:px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 md:mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight text-white leading-tight">
            Transform Conversations into <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">Intelligence</span>
          </h2>
          <p className="text-base md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Upload patient call recordings and let our AI-driven system transcribe and analyze insights with medical-grade precision.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "relative group overflow-hidden rounded-[2rem] md:rounded-[2.5rem] bg-slate-900/50 backdrop-blur-xl border-2 border-dashed transition-all duration-300 p-8 md:p-12",
            isDragging ? "border-blue-500 bg-blue-500/10 scale-[1.02]" : "border-slate-800 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10",
            isUploading && "pointer-events-none opacity-80"
          )}
        >
          <div className="flex flex-col items-center justify-center text-center">
            <motion.div
              animate={isDragging ? { scale: 1.1 } : { scale: 1 }}
              className={cn(
                "w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mb-4 md:mb-6 bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/20 transition-all duration-300",
                isDragging ? "ring-8 ring-blue-500/20" : ""
              )}
            >
              {isUploading ? (
                <Loader2 className="w-8 h-8 md:w-10 md:h-10 text-white animate-spin" />
              ) : (
                <Mic className="w-8 h-8 md:w-10 md:h-10 text-white" />
              )}
            </motion.div>

            <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
              {isUploading ? "Processing Audio..." : "Drop your recording here"}
            </h3>
            <p className="text-sm text-slate-400 mb-6 md:mb-8 max-w-sm">
              Support for audio (WAV, MP3, MPEG) and prescription images (JPEG, PNG, AVIF). Max file size: 50MB.
            </p>

            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold py-3 px-8 rounded-full shadow-lg shadow-blue-500/25 hover:scale-105 active:scale-95 transition-all flex items-center justify-center space-x-2"
              >
                <Upload className="w-5 h-5" />
                <span>Upload File</span>
              </button>
              <button
                disabled={isUploading}
                className="w-full sm:w-auto bg-slate-800 border border-slate-700 text-slate-300 font-semibold py-3 px-8 rounded-full hover:bg-slate-700 hover:border-slate-600 active:scale-95 transition-all flex items-center justify-center space-x-2"
              >
                <FileText className="w-5 h-5" />
                <span>Try Sample</span>
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="audio/*,video/mpeg,video/mp4,image/*"
            />
          </div>

          <AnimatePresence>
            {isUploading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mt-8 flex flex-col items-center w-full"
              >
                <div className="w-full max-w-md bg-slate-800 h-1.5 md:h-2 rounded-full overflow-hidden mb-4">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-600 to-cyan-500"
                    animate={{ width: ["0%", "33%", "66%", "100%"] }}
                    transition={{ duration: 10, repeat: Infinity }}
                  />
                </div>
                <div className="flex flex-wrap justify-center gap-4 md:gap-8 text-[10px] md:text-sm font-medium">
                  <span className={cn(
                    "transition-all duration-300 flex items-center",
                    (status === "uploading" || status === "transcribing" || status === "analyzing" || status === "completed") ? "text-green-500" : "text-slate-400"
                  )}>
                    {(status === "transcribing" || status === "analyzing" || status === "completed") ? "✓" : "⏳"} Upload
                  </span>
                  <span className={cn(
                    "transition-all duration-300 flex items-center",
                    (status === "transcribing" || status === "analyzing" || status === "completed") ? "text-green-500" : "text-slate-400"
                  )}>
                    {(status === "analyzing" || status === "completed") ? "✓" : (status === "transcribing" ? "⏳" : "○")} Transcribe
                  </span>
                  <span className={cn(
                    "transition-all duration-300 flex items-center",
                    (status === "analyzing" || status === "completed") ? "text-green-500" : "text-slate-400"
                  )}>
                    {status === "completed" ? "✓" : (status === "analyzing" ? "⏳" : "○")} Analyze
                  </span>
                  <span className={cn(
                    "transition-all duration-300 flex items-center",
                    status === "completed" ? "text-green-500" : "text-slate-400"
                  )}>
                    {status === "completed" ? "✓" : "○"} Complete
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;

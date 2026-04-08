"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Languages, MessageSquare } from "lucide-react";
import { cn } from "@/utils/cn";

interface Segment {
  text: string;
  start: number;
  end: number;
  speaker?: string;
  confidence?: number;
}

interface TranslatedSegment {
  text: string;
  start: number;
  end: number;
  speaker?: string;
}

interface TranscriptViewerProps {
  segments?: Segment[];
  translatedSegments?: TranslatedSegment[];
  fullText?: string;
  translatedText?: string;
  language?: string;
  confidence?: number;
}

const TranscriptViewer = ({ 
  segments, 
  translatedSegments,
  fullText, 
  translatedText,
  language, 
  confidence 
}: TranscriptViewerProps) => {
  const [showOriginal, setShowOriginal] = useState(false);
  
  const hasTranslation = translatedText || (translatedSegments && translatedSegments.length > 0);
  const isEnglish = language?.toLowerCase() === 'en' || language?.toLowerCase() === 'english';
  const shouldShowToggle = hasTranslation && !isEnglish;

  const currentSegments = (!showOriginal && translatedSegments && translatedSegments.length > 0) 
    ? translatedSegments 
    : segments;

  const currentFullText = (!showOriginal && translatedText) ? translatedText : fullText;

  if (!currentSegments || currentSegments.length === 0) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-4 sm:p-8 shadow-2xl shadow-black/50 h-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
          <h4 className="text-xl font-bold flex items-center text-white break-all">
            <MessageSquare className="w-5 h-5 mr-3 text-blue-400 flex-shrink-0" />
            Full Transcript
          </h4>
          {shouldShowToggle && (
            <button
              onClick={() => setShowOriginal(!showOriginal)}
              className="flex items-center space-x-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-all text-xs font-bold uppercase tracking-wider"
            >
              <Languages className="w-4 h-4" />
              <span>{showOriginal ? "Show English" : "Show Original"}</span>
            </button>
          )}
        </div>
        <p className="text-slate-400 leading-relaxed whitespace-pre-wrap font-medium">
          {currentFullText || "No transcript available."}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-4 sm:p-8 shadow-2xl shadow-black/50 h-full flex flex-col transition-all duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20 flex-shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xl font-bold text-white">Transcript</h4>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
              {showOriginal ? `Original (${language})` : "English Translation"}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {shouldShowToggle && (
            <button
              onClick={() => setShowOriginal(!showOriginal)}
              className="flex items-center space-x-2 px-4 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-all text-xs font-bold uppercase tracking-wider shadow-lg shadow-blue-600/20 active:scale-95"
            >
              <Languages className="w-4 h-4" />
              <span>{showOriginal ? "English" : "Original"}</span>
            </button>
          )}
          
          <div className={cn(
            "px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border shadow-sm",
            confidence && confidence > 0.8 
              ? "bg-green-500/10 border-green-500/20 text-green-400" 
              : "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
          )}>
            {confidence ? Math.round(confidence * 100) : 0}% Confidence
          </div>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto space-y-6 pr-4 custom-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={showOriginal ? "original" : "translated"}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {currentSegments.map((segment, idx) => {
              const isCoordinator = segment.speaker?.toLowerCase().includes("coordinator") || idx % 2 === 0;
              return (
                <div
                  key={idx}
                  className={cn(
                    "flex flex-col max-w-[85%]",
                    isCoordinator ? "self-start" : "self-end items-end"
                  )}
                >
                  <div className={cn(
                    "flex items-center space-x-2 mb-1.5 px-1",
                    isCoordinator ? "" : "flex-row-reverse space-x-reverse"
                  )}>
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-widest",
                      isCoordinator ? "text-blue-400" : "text-cyan-400"
                    )}>
                      {segment.speaker || (isCoordinator ? "Coordinator" : "Patient")}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {formatTime(segment.start)}
                    </span>
                  </div>
                  <div className={cn(
                    "px-6 py-4 rounded-3xl text-sm leading-relaxed font-medium shadow-sm border transition-all duration-300",
                    isCoordinator 
                      ? "bg-slate-800 text-slate-200 rounded-tl-none border-white/5 hover:border-blue-500/30" 
                      : "bg-gradient-to-br from-cyan-600 to-blue-700 text-white rounded-tr-none border-transparent hover:shadow-lg hover:shadow-cyan-500/20"
                  )}>
                    {segment.text}
                  </div>
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default TranscriptViewer;

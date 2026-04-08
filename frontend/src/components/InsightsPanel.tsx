"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  User, 
  Target, 
  CheckCircle, 
  AlertTriangle, 
  Lightbulb, 
  ArrowRightCircle, 
  Search,
  Pill,
  ShieldAlert
} from "lucide-react";
import { cn } from "@/utils/cn";

interface InsightsPanelProps {
  analysis?: {
    callSummary: string;
    patientConcerns: string[];
    patientIntent: string;
    disposition: string;
    followUpRequired: boolean;
    followUpTimeline?: string;
    risksBarriers: string[];
    missedOpportunities: string[];
    recommendedNextAction: string;
    confidenceScore?: number;
    medications?: {
      name: string;
      dosage: string;
      frequency: string;
      usageCause: string;
      ageLimit?: string;
    }[];
    evidenceLines?: Record<string, string[]>;
  };
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

const InsightsPanel = ({ analysis }: InsightsPanelProps) => {
  const [activeEvidence, setActiveEvidence] = useState<string | null>(null);

  if (!analysis) return null;

  const isPrescription = analysis.medications && analysis.medications.length > 0;

  const insights = [
    { 
      key: "callSummary",
      title: isPrescription ? "Prescription Overview" : "Call Summary", 
      content: analysis.callSummary, 
      icon: <FileText className="w-5 h-5" />, 
      color: "blue" 
    },
    { 
      key: "patientConcerns",
      title: isPrescription ? "Patient Instructions" : "Patient Concerns", 
      content: analysis.patientConcerns, 
      icon: <User className="w-5 h-5" />, 
      color: "cyan",
      isList: true
    },
    { 
      key: "patientIntent",
      title: isPrescription ? "Medical Intent" : "Patient Intent", 
      content: analysis.patientIntent, 
      icon: <Target className="w-5 h-5" />, 
      color: "indigo" 
    },
    { 
      key: "disposition",
      title: "Disposition", 
      content: analysis.disposition, 
      icon: <CheckCircle className="w-5 h-5" />, 
      color: "green" 
    },
    { 
      key: "risksBarriers",
      title: "Risks & Contraindications", 
      content: analysis.risksBarriers, 
      icon: <AlertTriangle className="w-5 h-5" />, 
      color: "red",
      isList: true
    },
    { 
      key: "recommendedNextAction",
      title: "Recommended Next Action", 
      content: analysis.recommendedNextAction, 
      icon: <ArrowRightCircle className="w-5 h-5" />, 
      color: "emerald" 
    }
  ];

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xl font-bold flex items-center text-white">
          <span className="w-1.5 h-6 bg-cyan-500 rounded-full mr-3" />
          AI Insights {isPrescription && " (Prescription)"}
        </h4>
        {analysis.confidenceScore && (
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Analysis Confidence</span>
            <div className="w-32 bg-slate-800 h-2 rounded-full overflow-hidden border border-white/10">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${analysis.confidenceScore * 100}%` }}
                className={cn(
                  "h-full rounded-full",
                  analysis.confidenceScore > 0.8 ? "bg-green-500" : "bg-yellow-500"
                )}
              />
            </div>
            <span className="text-[10px] font-bold text-slate-400">{Math.round(analysis.confidenceScore * 100)}%</span>
          </div>
        )}
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-6"
      >
        {isPrescription && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {analysis.medications?.map((med, idx) => (
              <motion.div
                key={`med-${idx}`}
                variants={item}
                whileHover={{ y: -4, scale: 1.01 }}
                className="p-6 rounded-2xl border border-blue-500/30 bg-blue-500/5 backdrop-blur-xl transition-all duration-300 group"
              >
                <div className="flex items-start space-x-4">
                  <div className="p-3 rounded-xl bg-blue-500/20 text-blue-400 group-hover:scale-110 transition-transform duration-300">
                    <Pill className="w-5 h-5" />
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-bold text-white text-lg">{med.name}</h5>
                      {med.ageLimit && (
                        <div className="flex items-center space-x-1 px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-widest">
                          <ShieldAlert className="w-3 h-3" />
                          <span>{med.ageLimit}</span>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-widest">Dosage</span>
                        <span className="text-slate-200">{med.dosage}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-widest">Frequency</span>
                        <span className="text-slate-200">{med.frequency}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-widest">Primary Use</span>
                      <span className="text-blue-300 font-medium">{med.usageCause}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {insights.map((insight, idx) => (
            <motion.div
              key={idx}
              variants={item}
              whileHover={{ y: -4, scale: 1.01 }}
              className={cn(
                "p-6 rounded-2xl border transition-all duration-300 group bg-slate-900/50 backdrop-blur-xl",
                `border-white/5 hover:border-${insight.color}-500/50 hover:shadow-lg hover:shadow-${insight.color}-500/10`
              )}
            >
              <div className="flex items-start space-x-4">
                <div className={cn(
                  "p-3 rounded-xl",
                  `bg-${insight.color}-500/10 text-${insight.color}-400 group-hover:scale-110 transition-transform duration-300`
                )}>
                  {insight.icon}
                </div>
                <div className="flex-grow">
                  <h5 className="font-bold text-white mb-2 flex items-center justify-between">
                    {insight.title}
                    {analysis.evidenceLines && analysis.evidenceLines[insight.key] && (
                      <button 
                        onClick={() => setActiveEvidence(activeEvidence === insight.key ? null : insight.key)}
                        className={cn(
                          "transition-colors rounded-full p-1.5 border",
                          activeEvidence === insight.key 
                            ? `bg-${insight.color}-500/20 text-${insight.color}-400 border-${insight.color}-500/30` 
                            : "text-slate-600 hover:text-slate-400 border-transparent hover:bg-slate-800"
                        )}
                        title="View Evidence from Transcript"
                      >
                        <Search className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </h5>
                  {insight.isList ? (
                    <ul className="space-y-2">
                      {(insight.content as string[]).map((item, i) => (
                        <li key={i} className="text-sm text-slate-400 flex items-start">
                          <span className={cn("w-1.5 h-1.5 rounded-full mt-1.5 mr-2 flex-shrink-0", `bg-${insight.color}-500`)} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-400 leading-relaxed">
                      {insight.content as string}
                    </p>
                  )}
                </div>
              </div>
              
              <AnimatePresence>
                {activeEvidence === insight.key && analysis.evidenceLines && analysis.evidenceLines[insight.key] && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 pt-4 border-t border-white/5">
                      <div className="flex items-center space-x-2 mb-3">
                        <Search className={cn("w-3 h-3", `text-${insight.color}-400`)} />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          Extracted Evidence
                        </span>
                      </div>
                      <ul className="space-y-2 pl-2 border-l-2 border-slate-700">
                        {analysis.evidenceLines[insight.key].map((line: string, i: number) => (
                          <li key={i} className="text-xs text-slate-400 italic">
                            "{line}"
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default InsightsPanel;

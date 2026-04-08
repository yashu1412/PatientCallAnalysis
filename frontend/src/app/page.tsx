"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, History, FileAudio, ChevronRight, RefreshCw, AlertCircle, ChevronLeft, FileImage } from "lucide-react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import TranscriptViewer from "@/components/TranscriptViewer";
import InsightsPanel from "@/components/InsightsPanel";
import JSONViewer from "@/components/JSONViewer";
import Footer from "@/components/Footer";
import { cn } from "@/utils/cn";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api";

export default function Home() {
  const [currentCall, setCurrentCall] = useState<any>(null);
  const [callHistory, setCallHistory] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async (page: number = 1) => {
    setIsLoadingHistory(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/calls?page=${page}&limit=9`);
      if (res.data.success) {
        setCallHistory(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err: any) {
      console.error("Failed to fetch history:", err);
      if (err.code === "ERR_NETWORK") {
        setError("Backend server is unreachable. Please ensure the backend is running on port 5000.");
      }
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory(pagination.page);
  }, []);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      fetchHistory(newPage);
    }
  };

  const handleSelectCall = async (callId: string) => {
    setError(null);
    try {
      const res = await axios.get(`${API_BASE_URL}/calls/${callId}`);
      if (res.data.success) {
        setCurrentCall(res.data.data);
        window.scrollTo({ top: 600, behavior: 'smooth' });
      }
    } catch (err: any) {
      setError("Failed to load call details.");
    }
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setStatus("uploading");
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const uploadRes = await axios.post(`${API_BASE_URL}/calls/upload`, formData);
      const callId = uploadRes.data.callId;
      
      if (uploadRes.data.type === "call") {
        setStatus("transcribing");
        await axios.post(`${API_BASE_URL}/calls/${callId}/transcribe`);
      }
      
      setStatus("analyzing");
      await axios.post(`${API_BASE_URL}/calls/${callId}/analyze`);
      
      const finalRes = await axios.get(`${API_BASE_URL}/calls/${callId}`);
      setCurrentCall(finalRes.data.data);
      setStatus("completed");
      
      fetchHistory();
    } catch (err: any) {
      console.error("Pipeline failed:", err);
      if (err.code === "ERR_NETWORK") {
        setError("Backend server is unreachable. Please ensure the backend is running on port 5000.");
      } else {
        setError(err.response?.data?.error || "An error occurred during processing.");
      }
      setStatus("failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <main className="flex-grow">
      <Navbar />
      
      <div className="max-w-7xl mx-auto pb-20">
        <HeroSection 
          onUpload={handleUpload} 
          isUploading={isUploading} 
          status={status}
        />

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mx-6 mb-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-center font-medium"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {currentCall && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-6 space-y-12 mt-12"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
              <h3 className="text-2xl font-bold text-white flex items-center break-all">
                <FileAudio className="w-7 h-7 mr-3 text-blue-400 flex-shrink-0" />
                {currentCall.fileName}
              </h3>
              <div className="text-sm text-slate-500 flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {new Date(currentCall.createdAt).toLocaleString()}
              </div>
            </div>

            <div className="flex flex-col space-y-12">
              {}
              <div className="w-full">
                {currentCall.type === "prescription" ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="futuristic-card overflow-hidden shadow-blue-500/10 max-w-4xl mx-auto"
                  >
                    <div className="p-4 border-b border-white/5 bg-slate-900/50 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prescription Image</span>
                      <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">AI Vision Active</span>
                    </div>
                    <img 
                      src={`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5000"}/${currentCall.fileUrl.replace(/\\/g, '/').replace(/.*uploads\//, 'uploads/')}`} 
                      alt="Prescription"
                      className="w-full h-auto object-contain max-h-[800px] hover:scale-[1.02] transition-transform duration-700"
                    />
                  </motion.div>
                ) : (
                  <div className="h-[750px] max-w-5xl mx-auto w-full">
                    <TranscriptViewer 
                      segments={currentCall.transcript?.segments}
                      translatedSegments={currentCall.transcript?.translatedSegments}
                      fullText={currentCall.transcript?.fullText}
                      translatedText={currentCall.transcript?.translatedText}
                      language={currentCall.transcript?.language}
                      confidence={currentCall.transcript?.confidence}
                    />
                  </div>
                )}
              </div>

              {}
              <div className="w-full">
                <InsightsPanel analysis={currentCall.analysis} />
              </div>
            </div>

            <div className="mt-20 pt-10 border-t border-white/5">
              <JSONViewer data={currentCall} />
            </div>
          </motion.div>
        )}

        <div className="mt-20 px-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 space-y-4 lg:space-y-0">
            <h4 className="text-2xl font-bold flex flex-col sm:flex-row sm:items-center text-white space-y-2 sm:space-y-0">
              <span className="flex items-center"><History className="w-7 h-7 mr-3 text-cyan-400" />Analysis History</span>
              <span className="sm:ml-4 text-xs font-normal text-slate-500 uppercase tracking-widest">
                {pagination.total} records found
              </span>
            </h4>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center bg-slate-900/50 rounded-full border border-white/5 p-1 w-full sm:w-auto justify-between sm:justify-start">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1 || isLoadingHistory}
                  className="p-2 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent rounded-full transition-all"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-400" />
                </button>
                <span className="px-4 text-sm font-bold text-slate-400">
                  {pagination.page} / {pagination.pages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages || isLoadingHistory}
                  className="p-2 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent rounded-full transition-all"
                >
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <button 
                onClick={() => fetchHistory(pagination.page)}
                disabled={isLoadingHistory}
                className="p-2 hover:bg-slate-800 rounded-full transition-colors"
              >
                <RefreshCw className={cn("w-5 h-5 text-slate-500", isLoadingHistory && "animate-spin")} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {callHistory.length > 0 ? (
                callHistory.map((call) => (
                  <motion.div
                    key={call._id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ y: -4 }}
                    onClick={() => handleSelectCall(call._id)}
                    className={cn(
                      "group cursor-pointer p-6 rounded-[2rem] border transition-all duration-300",
                      currentCall?._id === call._id 
                        ? "bg-blue-600/10 border-blue-500 shadow-lg shadow-blue-500/10" 
                        : "bg-slate-900/50 border-white/5 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/5"
                    )}
                  >
                    <div className="flex items-start justify-between mb-4 gap-2">
                      <div className={cn(
                        "p-3 rounded-xl flex-shrink-0",
                        currentCall?._id === call._id 
                          ? "bg-blue-600 text-white" 
                          : "bg-slate-800 text-slate-500 group-hover:bg-blue-500/20 group-hover:text-blue-400"
                      )}>
                        {call.type === "prescription" ? <FileImage className="w-5 h-5" /> : <FileAudio className="w-5 h-5" />}
                      </div>
                      <Badge status={call.status} />
                    </div>
                    
                    <h5 className="font-bold text-white mb-1 truncate" title={call.fileName}>
                      {call.fileName}
                    </h5>
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-4">
                      {new Date(call.createdAt).toLocaleDateString()} • {(call.fileSize / (1024 * 1024)).toFixed(2)} MB
                    </div>

                    <div className="flex items-center text-xs font-bold text-blue-400 group-hover:translate-x-1 transition-transform">
                      View Analysis <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                  </motion.div>
                ))
              ) : !isLoadingHistory && (
                <div className="col-span-full py-20 text-center bg-slate-900/30 rounded-[3rem] border-2 border-dashed border-slate-800">
                  <AlertCircle className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium">No analyses yet. Upload a recording to get started!</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}

const Badge = ({ status }: { status: string }) => {
  const styles: any = {
    uploaded: "bg-slate-800 text-slate-400",
    transcribed: "bg-blue-500/10 text-blue-400",
    analyzed: "bg-green-500/10 text-green-400",
    failed: "bg-red-500/10 text-red-400",
  };

  return (
    <span className={cn(
      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
      styles[status] || styles.uploaded
    )}>
      {status}
    </span>
  );
};

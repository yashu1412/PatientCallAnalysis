"use client";

import React from "react";
import { motion } from "framer-motion";
import { Heart, Github, Linkedin, Mail } from "lucide-react";

const Footer = () => {
  return (
    <footer className="w-full mt-20 border-t border-white/5 bg-slate-900/30 backdrop-blur-md py-12 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
        <div className="flex flex-col items-center md:items-start space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-cyan-500 rounded flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <span className="text-lg font-bold text-white">Docstribe AI</span>
          </div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">
            Next-Gen Medical Intelligence
          </p>
        </div>

        <div className="flex flex-col items-center space-y-2">
          <p className="text-sm text-slate-400 flex items-center">
            Developed with <Heart className="w-4 h-4 mx-1.5 text-red-500 fill-red-500 animate-pulse" /> by 
            <span className="ml-1.5 font-bold text-white hover:text-blue-400 transition-colors cursor-default">
              Yashpalsingh Pawara
            </span>
          </p>
          <p className="text-[10px] text-slate-600 uppercase tracking-[0.2em] font-bold">
            © 2026 All Rights Reserved
          </p>
        </div>

        <div className="flex items-center space-x-4">
          {[
            { icon: <Github className="w-5 h-5" />, href: "https://github.com/yashu1412" },
            { icon: <Linkedin className="w-5 h-5" />, href: "https://www.linkedin.com/in/yashpalsingh-pawara-46240b2b3/" },
            { icon: <Mail className="w-5 h-5" />, href: "mailto:yashpalsinghpawara@gmail.com" },
          ].map((social, i) => (
            <motion.a
              key={i}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ y: -3, scale: 1.1 }}
              className="p-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all border border-white/5"
            >
              {social.icon}
            </motion.a>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default Footer;

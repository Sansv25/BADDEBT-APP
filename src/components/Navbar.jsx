import React from 'react';
import { Sparkles, Database, FileSpreadsheet, Layers } from 'lucide-react';

export const Navbar = ({ totalRows, headingCount }) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Title Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 p-0.5 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Formatter List Pelanggan
              </h1>
              <span className="text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/50 uppercase">
                FAT / Bad Debt
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Perapi Teks Mentah Lapangan &amp; Export ke Word (.docx)
            </p>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-300">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Total Baris:</span>
            <strong className="text-white font-mono">{totalRows}</strong>
          </div>

          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-300">
            <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
            <span>Kode FAT:</span>
            <strong className="text-indigo-300 font-mono">{headingCount}</strong>
          </div>

          <div className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-emerald-400">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px]">Auto-saved</span>
          </div>
        </div>
      </div>
    </header>
  );
};

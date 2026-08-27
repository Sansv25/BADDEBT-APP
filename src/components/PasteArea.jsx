import React from 'react';
import { Clipboard, Play, RotateCcw, FileText, ArrowRight } from 'lucide-react';
import { SAMPLE_RAW_TEXT } from '../utils/parseRows';

export const PasteArea = ({ rawText, setRawText, onProcess, onClear }) => {
  const handleLoadSample = () => {
    setRawText(SAMPLE_RAW_TEXT);
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setRawText(text);
      }
    } catch (err) {
      console.error('Failed to read clipboard:', err);
    }
  };

  const lineCount = rawText ? rawText.split(/\r?\n/).filter((l) => l.trim().length > 0).length : 0;

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            1. Paste Teks Mentah Lapangan
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Tempelkan catatan dari WhatsApp / lapangan apa adanya di bawah ini
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handlePasteClipboard}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            <Clipboard className="w-3.5 h-3.5 text-cyan-400" />
            Paste Clipboard
          </button>
          <button
            type="button"
            onClick={handleLoadSample}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-950/70 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-800/60 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            Muat Teks Sample
          </button>
        </div>
      </div>

      <div className="relative">
        <textarea
          rows={7}
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="Contoh:&#10;DPRA036&#10;DPRF009&#10;#1 551002363888 Ary Asmara -8.6613081,115.186969&#10;#2 551001871139 Irwan Kurnia Yulianto..."
          className="w-full bg-slate-950/90 border border-slate-800 rounded-xl p-4 text-sm font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all resize-y"
        />
        {lineCount > 0 && (
          <span className="absolute bottom-3 right-3 text-[11px] font-mono bg-slate-900/90 border border-slate-800 px-2 py-1 rounded text-slate-400">
            {lineCount} baris terdeteksi
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
        <button
          type="button"
          onClick={onClear}
          disabled={!rawText}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 disabled:opacity-40 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Kosongkan Input
        </button>

        <button
          type="button"
          onClick={onProcess}
          disabled={!rawText.trim()}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm text-slate-950 bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-300 hover:from-cyan-300 hover:to-indigo-200 shadow-lg shadow-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all transform active:scale-95"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Proses Teks ke List</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

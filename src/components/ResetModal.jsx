import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export const ResetModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-full bg-rose-950/80 border border-rose-800/60 text-rose-400 flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-slate-100 mb-2">
          Reset Data &amp; Mulai Baru?
        </h3>
        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          Tindakan ini akan menghapus teks mentah dan seluruh list baris dari penyimpanan lokal (<code className="text-rose-300 font-mono text-xs">localStorage</code>). Data yang belum di-export akan hilang.
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/20 transition-all"
          >
            Ya, Reset Sekarang
          </button>
        </div>
      </div>
    </div>
  );
};

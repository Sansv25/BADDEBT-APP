import React, { useState } from 'react';
import { Download, Copy, RefreshCw, Check, Loader2, FileDown } from 'lucide-react';
import { downloadDocx } from '../utils/exportDocx';

export const ExportBar = ({ rows, onResetRequest }) => {
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

  const handleExportDocx = async () => {
    if (rows.length === 0) return;
    try {
      setIsExportingDocx(true);
      await downloadDocx(rows);
    } catch (err) {
      console.error('Failed to export DOCX:', err);
      alert('Gagal mengekspor file .docx: ' + err.message);
    } finally {
      setIsExportingDocx(false);
    }
  };

  const handleCopyText = async () => {
    if (rows.length === 0) return;
    try {
      // Join active rows with newlines
      const plainText = rows.map((r) => r.text).join('\n');
      await navigator.clipboard.writeText(plainText);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      alert('Gagal menyalin teks ke clipboard.');
    }
  };

  const isDisabled = rows.length === 0;

  return (
    <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 shadow-2xl backdrop-blur-md sticky bottom-4 z-20">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Helper info */}
        <div>
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <FileDown className="w-4 h-4 text-cyan-400" />
            3. Finalisasi &amp; Ekspor
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {rows.length > 0
              ? `${rows.length} baris siap di-export ke DOCX atau disalin ke Word`
              : 'List masih kosong. Masukkan dan proses teks mentah terlebih dahulu.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-3 w-full sm:w-auto">
          {/* Reset Button */}
          <button
            type="button"
            onClick={onResetRequest}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-400 bg-rose-950/40 hover:bg-rose-950/70 border border-rose-800/50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset / Mulai Baru
          </button>

          {/* Copy Plain Text */}
          <button
            type="button"
            onClick={handleCopyText}
            disabled={isDisabled}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-indigo-200 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 shadow-lg shadow-indigo-950/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {copiedToast ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300">Tersalin ke Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-indigo-400" />
                <span>Copy as Text</span>
              </>
            )}
          </button>

          {/* Export DOCX Button */}
          <button
            type="button"
            onClick={handleExportDocx}
            disabled={isDisabled || isExportingDocx}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-indigo-400 hover:from-cyan-300 hover:to-indigo-300 shadow-xl shadow-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all transform active:scale-95"
          >
            {isExportingDocx ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Generating DOCX...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Export DOCX</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Tag, Edit3, Check, Calendar, PowerOff, X, Clipboard } from 'lucide-react';
import { detectStatusFromText, formatStatusText, stripStatusSuffix } from '../utils/parseRows';

export const RowItem = ({
  row,
  index,
  onUpdateText,
  onToggleHeading,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localText, setLocalText] = useState(row.text);
  const [showPeriodInput, setShowPeriodInput] = useState(false);

  // Status detection from text
  const statusInfo = detectStatusFromText(row.text);
  const [periodInputText, setPeriodInputText] = useState(statusInfo.periodText || '2025-10-29 - 2025-11-28');
  const periodFieldRef = useRef(null);

  useEffect(() => {
    setLocalText(row.text);
    const info = detectStatusFromText(row.text);
    if (info.periodText) {
      setPeriodInputText(info.periodText);
    }
  }, [row.text]);

  useEffect(() => {
    if (showPeriodInput && periodFieldRef.current) {
      periodFieldRef.current.focus();
      periodFieldRef.current.select();
    }
  }, [showPeriodInput]);

  const handleSaveText = () => {
    if (localText.trim() !== row.text) {
      onUpdateText(row.id, localText.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSaveText();
    } else if (e.key === 'Escape') {
      setLocalText(row.text);
      setIsEditing(false);
    }
  };

  // Toggle Deaktivasi Status
  const handleToggleDeaktivasi = () => {
    if (statusInfo.statusType === 'deaktivasi') {
      const base = stripStatusSuffix(row.text);
      onUpdateText(row.id, base);
    } else {
      const base = stripStatusSuffix(row.text);
      const newText = formatStatusText(base, 'deaktivasi');
      onUpdateText(row.id, newText);
    }
    setShowPeriodInput(false);
  };

  // Apply Periode Status
  const handleApplyPeriode = (overrideText = null) => {
    const textToUse = overrideText !== null ? overrideText : periodInputText;
    if (textToUse.trim()) {
      const base = stripStatusSuffix(row.text);
      const newText = formatStatusText(base, 'periode', textToUse);
      onUpdateText(row.id, newText);
    }
    setShowPeriodInput(false);
  };

  // Paste direct from Clipboard into period
  const handlePasteClipboardToPeriod = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText.trim()) {
        const cleanedClip = clipText.trim().replace(/^\(|\)$/g, ''); // strip outer parens if copied with parens
        setPeriodInputText(cleanedClip);
        handleApplyPeriode(cleanedClip);
      }
    } catch (err) {
      console.error('Failed to read clipboard for period:', err);
    }
  };

  // Clear Periode Status
  const handleClearPeriode = () => {
    if (statusInfo.statusType === 'periode') {
      const base = stripStatusSuffix(row.text);
      onUpdateText(row.id, base);
    }
    setShowPeriodInput(false);
  };

  return (
    <div
      className={`group relative flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 rounded-xl border transition-all ${
        row.isHeading
          ? 'bg-indigo-950/40 border-indigo-500/30 hover:border-indigo-500/50 shadow-md shadow-indigo-950/20'
          : 'bg-slate-900/40 border-slate-800/70 hover:border-slate-700/80 hover:bg-slate-900/80'
      }`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Index number */}
        <span className="text-xs font-mono text-slate-500 w-6 text-right shrink-0">
          #{index + 1}
        </span>

        {/* Status Pill Toggle */}
        <button
          type="button"
          onClick={() => onToggleHeading(row.id)}
          title="Klik untuk mengubah tipe: Kode FAT / List biasa"
          className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 ${
            row.isHeading
              ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 hover:bg-indigo-500/30'
              : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-slate-200'
          }`}
        >
          <Tag className="w-3 h-3" />
          <span>{row.isHeading ? 'KODE FAT' : 'PELANGGAN'}</span>
        </button>

        {/* Text Field / Editor */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={localText}
                onChange={(e) => setLocalText(e.target.value)}
                onBlur={handleSaveText}
                onKeyDown={handleKeyDown}
                autoFocus
                className="w-full bg-slate-950 border border-cyan-500/60 rounded-lg px-3 py-1.5 text-sm font-mono text-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              />
              <button
                type="button"
                onClick={handleSaveText}
                className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => setIsEditing(true)}
              className={`cursor-pointer px-2 py-1 rounded hover:bg-slate-800/60 transition-colors flex items-center justify-between group/text ${
                row.isHeading
                  ? 'font-bold text-indigo-200 text-base font-mono tracking-wide'
                  : 'text-sm text-slate-200 font-mono'
              }`}
            >
              <span className="truncate">{row.text}</span>
              <Edit3 className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover/text:opacity-100 transition-opacity ml-2 shrink-0" />
            </div>
          )}
        </div>
      </div>

      {/* Control Actions (Status buttons + Delete) */}
      <div className="flex flex-wrap items-center justify-end gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800/60">
        {/* Deaktivasi Option Button */}
        <button
          type="button"
          onClick={handleToggleDeaktivasi}
          title={statusInfo.statusType === 'deaktivasi' ? 'Hapus status Deaktivasi' : 'Tambahkan status (Deaktivasi)'}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
            statusInfo.statusType === 'deaktivasi'
              ? 'bg-rose-950/80 text-rose-300 border-rose-700/80 shadow-sm shadow-rose-950/40 font-semibold'
              : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:bg-rose-950/40 hover:text-rose-300 hover:border-rose-800/50'
          }`}
        >
          <PowerOff className="w-3.5 h-3.5 text-rose-400" />
          <span>Deaktivasi</span>
          {statusInfo.statusType === 'deaktivasi' && <Check className="w-3.5 h-3.5 text-rose-400 ml-0.5" />}
        </button>

        {/* Periode Terakhir Option Button */}
        <button
          type="button"
          onClick={() => setShowPeriodInput(!showPeriodInput)}
          title="Paste / Input Periode Terakhir"
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
            statusInfo.statusType === 'periode'
              ? 'bg-cyan-950/80 text-cyan-300 border-cyan-700/80 shadow-sm shadow-cyan-950/40 font-semibold'
              : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:bg-cyan-950/40 hover:text-cyan-300 hover:border-cyan-800/50'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-cyan-400" />
          <span>Periode</span>
          {statusInfo.statusType === 'periode' && <Check className="w-3.5 h-3.5 text-cyan-400 ml-0.5" />}
        </button>

        {/* Delete Row Button */}
        <button
          type="button"
          onClick={() => onDelete(row.id)}
          title="Hapus baris ini"
          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-300 hover:bg-rose-950/60 border border-transparent hover:border-rose-800/50 transition-colors ml-1"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Inline Period Text Input Panel */}
      {showPeriodInput && (
        <div className="w-full mt-2 p-3 bg-slate-950/95 border border-cyan-700/60 rounded-xl shadow-2xl flex flex-col sm:flex-row items-center gap-2.5 animate-fadeIn z-10">
          <div className="flex items-center gap-2 flex-1 w-full text-xs">
            <span className="text-cyan-400 shrink-0 font-medium flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Periode:
            </span>
            <input
              ref={periodFieldRef}
              type="text"
              placeholder="Paste teks periode, contoh: 2025-10-29 - 2025-11-28"
              value={periodInputText}
              onChange={(e) => setPeriodInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleApplyPeriode();
                if (e.key === 'Escape') setShowPeriodInput(false);
              }}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-cyan-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/40"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handlePasteClipboardToPeriod}
              title="Paste teks langsung dari Clipboard"
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium inline-flex items-center gap-1 border border-slate-700 transition-colors"
            >
              <Clipboard className="w-3.5 h-3.5 text-cyan-400" />
              Paste
            </button>
            <button
              type="button"
              onClick={() => handleApplyPeriode()}
              className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors"
            >
              Terapkan
            </button>
            {statusInfo.statusType === 'periode' && (
              <button
                type="button"
                onClick={handleClearPeriode}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 text-xs transition-colors"
              >
                Hapus Suffix
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowPeriodInput(false)}
              className="p-1 text-slate-400 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

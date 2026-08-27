import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { PasteArea } from './components/PasteArea';
import { RowList } from './components/RowList';
import { ExportBar } from './components/ExportBar';
import { ResetModal } from './components/ResetModal';
import {
  getStoredRawText,
  setStoredRawText,
  getStoredRows,
  setStoredRows,
  clearStoredData,
} from './utils/storage';
import { parseRawTextToRows } from './utils/parseRows';

export function App() {
  const [rawText, setRawText] = useState(() => getStoredRawText());
  const [rows, setRows] = useState(() => {
    const stored = getStoredRows();
    if (stored !== null) return stored;
    // If no stored rows exist but rawText is present, parse it initially
    const initialRaw = getStoredRawText();
    return initialRaw ? parseRawTextToRows(initialRaw) : [];
  });
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Sync rawText changes to localStorage
  useEffect(() => {
    setStoredRawText(rawText);
  }, [rawText]);

  // Sync rows changes to localStorage
  useEffect(() => {
    setStoredRows(rows);
  }, [rows]);

  // Handle parsing raw text into rows
  const handleProcessText = () => {
    const parsed = parseRawTextToRows(rawText);
    setRows(parsed);
  };

  // Handle clearing raw text input
  const handleClearRawText = () => {
    setRawText('');
  };

  // Row operations
  const handleUpdateRowText = (id, newText) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, text: newText } : r))
    );
  };

  const handleToggleHeading = (id) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isHeading: !r.isHeading } : r))
    );
  };

  const handleDeleteRow = (id) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleAddRow = (text) => {
    const newRow = {
      id: 'row_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now(),
      text: text,
      isHeading: !text.startsWith('#') && !/\s/.test(text),
    };
    setRows((prev) => [...prev, newRow]);
  };

  const handleResetConfirm = () => {
    clearStoredData();
    setRawText('');
    setRows([]);
    setIsResetModalOpen(false);
  };

  const headingCount = rows.filter((r) => r.isHeading).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white">
      {/* Background ambient lighting */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed top-1/3 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <Navbar totalRows={rows.length} headingCount={headingCount} />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 space-y-8 relative z-10">
        {/* Step 1: Input Paste Area */}
        <PasteArea
          rawText={rawText}
          setRawText={setRawText}
          onProcess={handleProcessText}
          onClear={handleClearRawText}
        />

        {/* Step 2: Row List Section */}
        <RowList
          rows={rows}
          onUpdateText={handleUpdateRowText}
          onToggleHeading={handleToggleHeading}
          onDeleteRow={handleDeleteRow}
          onAddRow={handleAddRow}
        />

        {/* Step 3: Export Bar */}
        <ExportBar
          rows={rows}
          onResetRequest={() => setIsResetModalOpen(true)}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500 relative z-10">
        <p>
          Formatter List Pelanggan (Bad Debt / FAT) &bull; Client-Side &amp; Privacy-First Tool
        </p>
      </footer>

      {/* Reset Confirmation Modal */}
      <ResetModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleResetConfirm}
      />
    </div>
  );
}

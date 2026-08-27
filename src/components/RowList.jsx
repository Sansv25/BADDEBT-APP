import React, { useState } from 'react';
import { RowItem } from './RowItem';
import { ListFilter, Plus, Search, Layers } from 'lucide-react';

export const RowList = ({
  rows,
  onUpdateText,
  onToggleHeading,
  onDeleteRow,
  onAddRow,
}) => {
  const [filterType, setFilterType] = useState('all'); // 'all' | 'heading' | 'item'
  const [searchQuery, setSearchQuery] = useState('');
  const [newRowText, setNewRowText] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const filteredRows = rows.filter((row) => {
    const matchesSearch = row.text.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterType === 'heading') return matchesSearch && row.isHeading;
    if (filterType === 'item') return matchesSearch && !row.isHeading;
    return matchesSearch;
  });

  const handleAddNewRowSubmit = (e) => {
    e.preventDefault();
    if (newRowText.trim()) {
      onAddRow(newRowText.trim());
      setNewRowText('');
      setIsAdding(false);
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            2. List Hasil Process (Editable &amp; Deletable)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Klik teks untuk edit, atur badge FAT/Pelanggan, Deaktivasi, atau Periode Terakhir
          </p>
        </div>

        {/* Filter Controls & Add Button */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari di list..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center p-1 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                filterType === 'all'
                  ? 'bg-slate-800 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Semua ({rows.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('heading')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                filterType === 'heading'
                  ? 'bg-indigo-900/80 text-indigo-200 font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              FAT ({rows.filter((r) => r.isHeading).length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('item')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                filterType === 'item'
                  ? 'bg-slate-800 text-cyan-300 font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pelanggan ({rows.filter((r) => !r.isHeading).length})
            </button>
          </div>

          {/* Add Row Toggle */}
          <button
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/60 transition-colors"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            Tambah Baris
          </button>
        </div>
      </div>

      {/* Add New Row Inline Form */}
      {isAdding && (
        <form onSubmit={handleAddNewRowSubmit} className="mb-4 p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/50 flex gap-2">
          <input
            type="text"
            placeholder="Tulis baris baru (misal: #15 551000... atau FAT Kode)..."
            value={newRowText}
            onChange={(e) => setNewRowText(e.target.value)}
            autoFocus
            className="flex-1 bg-slate-950 border border-emerald-700/60 rounded-lg px-3 py-1.5 text-xs font-mono text-emerald-200 focus:outline-none"
          />
          <button
            type="submit"
            className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-colors"
          >
            Simpan
          </button>
          <button
            type="button"
            onClick={() => setIsAdding(false)}
            className="px-3 py-1.5 rounded-lg text-slate-400 hover:bg-slate-800 text-xs"
          >
            Batal
          </button>
        </form>
      )}

      {/* Rows Container */}
      {filteredRows.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-800 bg-slate-950/40">
          <ListFilter className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-400">Tidak ada baris untuk ditampilkan</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {rows.length === 0
              ? 'Paste teks mentah di area atas lalu klik tombol "Proses Teks ke List".'
              : 'Tidak ditemukan baris yang cocok dengan kata kunci pencarian atau filter pilihan.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
          {filteredRows.map((row) => {
            const originalIndex = rows.findIndex((r) => r.id === row.id);
            return (
              <RowItem
                key={row.id}
                row={row}
                index={originalIndex}
                onUpdateText={onUpdateText}
                onToggleHeading={onToggleHeading}
                onDelete={onDeleteRow}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

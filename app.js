// Storage Keys
const STORAGE_KEY_RAW = 'formatter_raw_text';
const STORAGE_KEY_ROWS = 'formatter_rows';
const STORAGE_KEY_SETTINGS = 'formatter_settings';

const SAMPLE_RAW_TEXT = `DPRA160
#1 551002266985 Riko Pramanto
#2 130091822 Natasha Shannon
#3 5510022669850 Norma Arindri Dangkua (DEAKTIVASI)
#4 551000192033 I Ketut Dedik Mahardika
#5 55100226698500 Anasthasia Putri Sudarsono
#6 551004889297 Ida Made Ara Runa
#7 551002266985000 Ester
#8 `;

const DEFAULT_SETTINGS = {
  theme: 'dark',
  enableAnomalyPeriod: true,
  enableAnomalyNoServiceId: true,
  enableHighlightNoStatus: true,
  enableFatCodeConfirm: true,
  enableCopyServiceId: true,
};

let savedSettings = null;
try {
  savedSettings = JSON.parse(localStorage.getItem(STORAGE_KEY_SETTINGS));
} catch(e) {}

// App State
let state = {
  rawText: localStorage.getItem(STORAGE_KEY_RAW) || '',
  rows: JSON.parse(localStorage.getItem(STORAGE_KEY_ROWS) || '[]'),
  settings: { ...DEFAULT_SETTINGS, ...savedSettings },
  filterType: 'all', // 'all' | 'heading' | 'item'
  searchQuery: '',
  editingRowId: null,
  activePeriodRowId: null,
  draggedIndex: null,
  history: [],
  historyIndex: -1,
};

// Auto-parse on load if raw text exists but rows empty
if (!state.rows || state.rows.length === 0) {
  if (state.rawText.trim()) {
    state.rows = parseRawTextToRows(state.rawText);
    saveRows();
    syncRawTextFromRows();
  }
}

// Storage Helpers
function saveSettings() {
  localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(state.settings));
}

function applyTheme() {
  if (state.settings.theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}
applyTheme();

function saveRawText() {
  localStorage.setItem(STORAGE_KEY_RAW, state.rawText);
}

function saveRows(skipHistory = false) {
  localStorage.setItem(STORAGE_KEY_ROWS, JSON.stringify(state.rows));
  if (!skipHistory) {
    if (state.historyIndex < state.history.length - 1) {
      state.history = state.history.slice(0, state.historyIndex + 1);
    }
    if (state.history.length >= 50) {
      state.history.shift();
    } else {
      state.historyIndex++;
    }
    state.history.push(JSON.parse(JSON.stringify(state.rows)));
    updateUndoRedoButtons();
  }
}

// Keep textarea and rawText state in sync with current rows
function syncRawTextFromRows() {
  state.rawText = state.rows.map((r) => r.text).join('\n');
  if (rawTextInput) {
    rawTextInput.value = state.rawText;
  }
  saveRawText();
  updateLineCountBadge();
}

function clearAllData() {
  localStorage.removeItem(STORAGE_KEY_RAW);
  localStorage.removeItem(STORAGE_KEY_ROWS);
  state.rawText = '';
  state.rows = [];
  state.searchQuery = '';
  state.activePeriodRowId = null;
  state.editingRowId = null;
  state.draggedIndex = null;
  state.history = [];
  state.historyIndex = -1;
  saveRows();
  renderApp();
}

function undo() {
  if (state.historyIndex > 0) {
    state.historyIndex--;
    state.rows = JSON.parse(JSON.stringify(state.history[state.historyIndex]));
    saveRows(true);
    syncRawTextFromRows();
    renderApp();
    updateUndoRedoButtons();
  }
}

function redo() {
  if (state.historyIndex < state.history.length - 1) {
    state.historyIndex++;
    state.rows = JSON.parse(JSON.stringify(state.history[state.historyIndex]));
    saveRows(true);
    syncRawTextFromRows();
    renderApp();
    updateUndoRedoButtons();
  }
}

function updateUndoRedoButtons() {
  const btnUndo = document.getElementById('btn-undo');
  const btnRedo = document.getElementById('btn-redo');
  if (btnUndo) btnUndo.disabled = state.historyIndex <= 0;
  if (btnRedo) btnRedo.disabled = state.historyIndex >= state.history.length - 1;
}

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'z') {
    e.preventDefault();
    undo();
  } else if ((e.ctrlKey && e.key.toLowerCase() === 'y') || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'z')) {
    e.preventDefault();
    redo();
  }
});

// Text Utilities & Cleaning
function isFatHeading(lineText) {
  const trimmed = lineText.trim();
  if (!trimmed) return false;
  return !trimmed.startsWith('#');
}

function stripStatusSuffix(text) {
  if (!text) return '';
  return text
    .replace(/\s*\(\s*deaktivasi\s*\)$/i, '')
    .replace(/\s*\(\s*\d{4}-\d{2}-\d{2}\s*[-–]\s*\d{4}-\d{2}-\d{2}\s*\)$/i, '')
    .replace(/\s*\(\s*[^)]+\)$/i, '')
    .trim();
}

function detectStatusFromText(text) {
  const trimmed = text.trim();
  if (/\(\s*deaktivasi\s*\)$/i.test(trimmed)) {
    return {
      statusType: 'deaktivasi',
      baseText: stripStatusSuffix(trimmed),
      periodText: '',
    };
  }

  const periodMatch = trimmed.match(/\(\s*(\d{4}-\d{2}-\d{2}\s*[-–]\s*\d{4}-\d{2}-\d{2})\s*\)$/i);
  if (periodMatch) {
    return {
      statusType: 'periode',
      baseText: stripStatusSuffix(trimmed),
      periodText: periodMatch[1],
    };
  }

  return {
    statusType: 'none',
    baseText: trimmed,
    periodText: '',
  };
}

function formatStatusText(baseText, statusType, periodText = '') {
  const clean = stripStatusSuffix(baseText);
  if (statusType === 'deaktivasi') {
    return `${clean} (Deaktivasi)`;
  }
  if (statusType === 'periode' && periodText.trim()) {
    return `${clean} (${periodText.trim()})`;
  }
  return clean;
}

function cleanAndNormalizeLine(line) {
  if (!line) return '';
  let cleaned = line.trim().replace(/[ \t]+/g, ' ');
  cleaned = cleaned.replace(/\(\s*deaktivasi\s*\)$/i, '(Deaktivasi)');
  return cleaned;
}

function isBareNumberStub(line) {
  const trimmed = line.trim();
  return /^#\d*\s*$/.test(trimmed);
}

function parseRawTextToRows(rawText) {
  if (!rawText) return [];
  const lines = rawText.split(/\r?\n/);
  const result = [];

  lines.forEach((line) => {
    const cleaned = cleanAndNormalizeLine(line);
    if (cleaned.length > 0 && !isBareNumberStub(cleaned)) {
      result.push({
        id: 'row_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now(),
        text: cleaned,
        isHeading: isFatHeading(cleaned),
      });
    }
  });

  return result;
}

// DOM Elements
const rawTextInput = document.getElementById('raw-text-input');
const lineCountBadge = document.getElementById('line-count-badge');
const statTotalRows = document.getElementById('stat-total-rows');
const statFatCount = document.getElementById('stat-fat-count');
const rowsContainer = document.getElementById('rows-container');
const emptyState = document.getElementById('empty-state');
const exportHelperText = document.getElementById('export-helper-text');

const countFilterAll = document.getElementById('count-filter-all');
const countFilterFat = document.getElementById('count-filter-fat');
const countFilterItem = document.getElementById('count-filter-item');

const filterTabAll = document.getElementById('filter-tab-all');
const filterTabFat = document.getElementById('filter-tab-fat');
const filterTabItem = document.getElementById('filter-tab-item');

const btnCopyText = document.getElementById('btn-copy-text');
const btnExportDocx = document.getElementById('btn-export-docx');

// Event Listeners & Live Auto Update Input
let inputDebounceTimer = null;

rawTextInput.addEventListener('input', (e) => {
  state.rawText = e.target.value;
  saveRawText();
  updateLineCountBadge();

  // Real-time auto-update rows as user types or pastes
  clearTimeout(inputDebounceTimer);
  inputDebounceTimer = setTimeout(() => {
    state.rows = parseRawTextToRows(state.rawText);
    saveRows();
    renderApp();
  }, 250);
});

document.getElementById('btn-add-fat')?.addEventListener('click', () => {
  Swal.fire({
    title: 'Tambahkan 1 FAT',
    html: `
      <p class="text-xs text-slate-500 dark:text-slate-400 text-left mb-2">Paste satu grup teks FAT beserta list pelanggannya:</p>
      <textarea id="swal-fat-input" rows="7" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-sm font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"></textarea>
    `,
    showCancelButton: true,
    confirmButtonColor: '#0891b2',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Tambahkan',
    cancelButtonText: 'Batal',
    background: document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff',
    color: document.documentElement.classList.contains('dark') ? '#f1f5f9' : '#0f172a',
    preConfirm: () => {
      const val = document.getElementById('swal-fat-input').value;
      if (!val.trim()) {
        Swal.showValidationMessage('Teks tidak boleh kosong');
        return false;
      }
      return val;
    }
  }).then((result) => {
    if (result.isConfirmed) {
      const newRows = parseRawTextToRows(result.value);
      if (newRows.length > 0) {
        state.rows = [...state.rows, ...newRows];
        saveRows();
        syncRawTextFromRows();
        renderApp();
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'FAT berhasil ditambahkan!',
          showConfirmButton: false,
          timer: 2000,
          background: document.documentElement.classList.contains('dark') ? '#1e293b' : '#ffffff',
          color: document.documentElement.classList.contains('dark') ? '#f8fafc' : '#0f172a'
        });
      }
    }
  });
});

document.getElementById('btn-paste-clipboard').addEventListener('click', async () => {
  try {
    const text = await navigator.clipboard.readText();
    if (text) {
      state.rawText = text;
      rawTextInput.value = text;
      saveRawText();
      state.rows = parseRawTextToRows(state.rawText);
      saveRows();
      syncRawTextFromRows();
      renderApp();
    }
  } catch (err) {
    console.error('Clipboard access error:', err);
  }
});

document.getElementById('btn-clear-raw').addEventListener('click', () => {
  state.rawText = '';
  rawTextInput.value = '';
  saveRawText();
  state.rows = [];
  saveRows();
  renderApp();
});

document.getElementById('btn-process-text').addEventListener('click', () => {
  state.rows = parseRawTextToRows(state.rawText);
  saveRows();
  syncRawTextFromRows();
  renderApp();
});

document.getElementById('search-input').addEventListener('input', (e) => {
  state.searchQuery = e.target.value;
  renderRowsList();
});

filterTabAll.addEventListener('click', () => setFilter('all'));
filterTabFat.addEventListener('click', () => setFilter('heading'));
filterTabItem.addEventListener('click', () => setFilter('item'));

function setFilter(type) {
  state.filterType = type;
  [filterTabAll, filterTabFat, filterTabItem].forEach((tab) => {
    tab.className = 'px-2.5 py-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-200 transition-colors';
  });
  if (type === 'all') filterTabAll.className = 'px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-black dark:text-white font-medium shadow-sm transition-colors';
  if (type === 'heading') filterTabFat.className = 'px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-900/80 text-indigo-800 dark:text-indigo-200 font-medium shadow-sm transition-colors';
  if (type === 'item') filterTabItem.className = 'px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 font-medium shadow-sm transition-colors';
  renderRowsList();
}

// Add Row Inline Form
const btnToggleAddRow = document.getElementById('btn-toggle-add-row');
const addRowFormContainer = document.getElementById('add-row-form-container');
const addRowInput = document.getElementById('add-row-input');

btnToggleAddRow.addEventListener('click', () => {
  addRowFormContainer.classList.toggle('hidden');
  if (!addRowFormContainer.classList.contains('hidden')) {
    addRowInput.focus();
  }
});

document.getElementById('btn-save-new-row').addEventListener('click', submitNewRow);
addRowInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') submitNewRow();
});
document.getElementById('btn-cancel-new-row').addEventListener('click', () => {
  addRowFormContainer.classList.add('hidden');
  addRowInput.value = '';
});

function submitNewRow() {
  const text = addRowInput.value.trim();
  if (text) {
    state.rows.push({
      id: 'row_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now(),
      text: text,
      isHeading: isFatHeading(text),
    });
    saveRows();
    syncRawTextFromRows();
    addRowInput.value = '';
    addRowFormContainer.classList.add('hidden');
    renderApp();
  }
}

// Undo / Redo & Clear Status Listeners
const btnUndo = document.getElementById('btn-undo');
const btnRedo = document.getElementById('btn-redo');
const btnClearAllStatus = document.getElementById('btn-clear-all-status');

if (btnUndo) btnUndo.addEventListener('click', undo);
if (btnRedo) btnRedo.addEventListener('click', redo);

// Settings logic
const btnSettings = document.getElementById('btn-settings');
if (btnSettings) {
  btnSettings.addEventListener('click', () => {
    Swal.fire({
      title: 'Pengaturan (Settings)',
      html: `
        <div class="text-left space-y-4 text-sm mt-4 text-slate-900 dark:text-slate-200">
          <div class="flex items-center justify-between">
            <span>Tema Gelap (Dark Mode)</span>
            <input type="checkbox" id="swal-theme" ${state.settings.theme === 'dark' ? 'checked' : ''} class="w-4 h-4 accent-cyan-600 cursor-pointer">
          </div>
          <hr class="border-slate-200 dark:border-slate-700">
          <div class="flex items-center justify-between">
            <span>Tandai Anomali: Periode Lampau</span>
            <input type="checkbox" id="swal-anom-period" ${state.settings.enableAnomalyPeriod ? 'checked' : ''} class="w-4 h-4 accent-cyan-600 cursor-pointer">
          </div>
          <div class="flex items-center justify-between">
            <span>Tandai Anomali: Tanpa Service ID</span>
            <input type="checkbox" id="swal-anom-sid" ${state.settings.enableAnomalyNoServiceId ? 'checked' : ''} class="w-4 h-4 accent-cyan-600 cursor-pointer">
          </div>
          <div class="flex items-center justify-between">
            <span>Sorot Pelanggan Belum Diproses</span>
            <input type="checkbox" id="swal-hl-nostatus" ${state.settings.enableHighlightNoStatus ? 'checked' : ''} class="w-4 h-4 accent-cyan-600 cursor-pointer">
          </div>
          <div class="flex items-center justify-between">
            <span>Konfirmasi Hapus Kode FAT</span>
            <input type="checkbox" id="swal-fat-confirm" ${state.settings.enableFatCodeConfirm ? 'checked' : ''} class="w-4 h-4 accent-cyan-600 cursor-pointer">
          </div>
          <div class="flex items-center justify-between">
            <span>Tampilkan Tombol Copy Service ID</span>
            <input type="checkbox" id="swal-copy-sid" ${state.settings.enableCopyServiceId ? 'checked' : ''} class="w-4 h-4 accent-cyan-600 cursor-pointer">
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonColor: '#0891b2',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Simpan',
      cancelButtonText: 'Batal',
      background: document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff',
      color: document.documentElement.classList.contains('dark') ? '#f1f5f9' : '#0f172a',
      preConfirm: () => {
        return {
          theme: document.getElementById('swal-theme').checked ? 'dark' : 'light',
          enableAnomalyPeriod: document.getElementById('swal-anom-period').checked,
          enableAnomalyNoServiceId: document.getElementById('swal-anom-sid').checked,
          enableHighlightNoStatus: document.getElementById('swal-hl-nostatus').checked,
          enableFatCodeConfirm: document.getElementById('swal-fat-confirm').checked,
          enableCopyServiceId: document.getElementById('swal-copy-sid').checked,
        };
      }
    }).then((result) => {
      if (result.isConfirmed) {
        state.settings = result.value;
        saveSettings();
        applyTheme();
        renderApp();
      }
    });
  });
}

if (btnClearAllStatus) {
  btnClearAllStatus.addEventListener('click', () => {
    if (state.rows.length === 0) return;
    Swal.fire({
      title: 'Hapus Semua Keterangan?',
      text: 'Ini akan menghapus status (Periode & Deaktivasi) dari semua pelanggan. Nama pelanggan tidak akan dihapus.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d97706',
      cancelButtonColor: '#334155',
      confirmButtonText: 'Ya, Hapus Keterangan',
      cancelButtonText: 'Batal',
      background: '#0f172a',
      color: '#f1f5f9'
    }).then((result) => {
      if (result.isConfirmed) {
        let hasChanges = false;
        state.rows.forEach(row => {
          if (!row.isHeading) {
            const newText = stripStatusSuffix(row.text);
            if (newText !== row.text) {
              row.text = newText;
              hasChanges = true;
            }
          }
        });
        if (hasChanges) {
          state.activePeriodRowId = null;
          saveRows();
          syncRawTextFromRows();
          renderApp();
        }
        Swal.fire({
          title: 'Berhasil',
          text: 'Semua keterangan telah dihapus.',
          icon: 'success',
          background: '#0f172a',
          color: '#f1f5f9',
          timer: 1500,
          showConfirmButton: false
        });
      }
    });
  });
}

// Reset Action (SweetAlert2)
document.getElementById('btn-open-reset').addEventListener('click', () => {
  Swal.fire({
    title: 'Reset Data & Mulai Baru?',
    text: 'Tindakan ini akan menghapus teks mentah dan seluruh list baris. Data yang belum di-export akan hilang.',
    icon: 'error',
    showCancelButton: true,
    confirmButtonColor: '#e11d48',
    cancelButtonColor: '#334155',
    confirmButtonText: 'Ya, Reset Sekarang',
    cancelButtonText: 'Batal',
    background: '#0f172a',
    color: '#f1f5f9'
  }).then((result) => {
    if (result.isConfirmed) {
      clearAllData();
    }
  });
});

// Copy & Export
function buildRichClipboard(rows) {
  const plain = rows.map((r) => r.text).join('\n');

  const htmlParagraphs = rows.map((r) => {
    const escapedText = escapeHtml(r.text);
    const isHeading = r.isHeading !== undefined ? r.isHeading : isFatHeading(r.text);
    if (isHeading) {
      return `<p style="font-family:'Times New Roman',Times,serif;font-size:26pt;font-weight:bold;color:#1F5C73;margin:0 0 6pt 0;">${escapedText}</p>`;
    }
    return `<p style="font-family:'Times New Roman',Times,serif;font-size:11pt;font-weight:normal;color:#000000;margin:0 0 4pt 0;">${escapedText}</p>`;
  });

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${htmlParagraphs.join('')}</body></html>`;

  return { plain, html };
}

async function copyRowsAsRichText(rows) {
  const { plain, html } = buildRichClipboard(rows);

  try {
    if (navigator.clipboard && typeof window.ClipboardItem !== 'undefined') {
      const blobHtml = new Blob([html], { type: 'text/html' });
      const blobText = new Blob([plain], { type: 'text/plain' });
      const item = new ClipboardItem({
        'text/html': blobHtml,
        'text/plain': blobText,
      });
      await navigator.clipboard.write([item]);
    } else {
      await navigator.clipboard.writeText(plain);
    }
  } catch (err) {
    console.warn('Clipboard write fallback to writeText:', err);
    await navigator.clipboard.writeText(plain);
  }
}

btnCopyText.addEventListener('click', async () => {
  if (state.rows.length === 0) return;
  try {
    await copyRowsAsRichText(state.rows);
    const label = document.getElementById('copy-btn-label');
    const orig = label ? label.innerText : 'Copy as Text';
    if (label) label.innerText = 'Tersalin ke Clipboard!';
    setTimeout(() => {
      if (label) label.innerText = orig;
    }, 1500);
  } catch (err) {
    console.error('Copy failed:', err);
    Swal.fire({
      title: 'Gagal',
      text: 'Gagal menyalin ke clipboard',
      icon: 'error',
      background: '#0f172a',
      color: '#f1f5f9'
    });
  }
});

btnExportDocx.addEventListener('click', async () => {
  if (state.rows.length === 0) return;
  try {
    const docxLib = window.docx;
    if (!docxLib) {
      Swal.fire({
        title: 'Mohon Tunggu',
        text: 'Library docx sedang dimuat, silakan coba lagi beberapa saat.',
        icon: 'info',
        background: '#0f172a',
        color: '#f1f5f9'
      });
      return;
    }

    const { Document, Packer, Paragraph, TextRun } = docxLib;
    const children = [];

    state.rows.forEach((row) => {
      const isHeading = row.isHeading !== undefined ? row.isHeading : isFatHeading(row.text);
      if (isHeading) {
        children.push(
          new Paragraph({
            spacing: { before: 240, after: 120 },
            children: [
              new TextRun({
                text: row.text,
                bold: true,
                font: 'Times New Roman',
                size: 52, // 26pt
                color: '1F5C73',
              }),
            ],
          })
        );
      } else {
        children.push(
          new Paragraph({
            spacing: { before: 0, after: 80 },
            children: [
              new TextRun({
                text: row.text,
                bold: false,
                font: 'Times New Roman',
                size: 22, // 11pt
                color: '000000',
              }),
            ],
          })
        );
      }
    });

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
            },
          },
          children: children,
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'List_Pelanggan_Bad_Debt.docx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (err) {
    console.error('Export error:', err);
    Swal.fire({
      title: 'Error',
      text: 'Gagal mengekspor file docx: ' + err.message,
      icon: 'error',
      background: '#0f172a',
      color: '#f1f5f9'
    });
  }
});

// Render Functions
function updateLineCountBadge() {
  const count = state.rawText ? state.rawText.split(/\r?\n/).filter((l) => l.trim().length > 0).length : 0;
  if (count > 0) {
    lineCountBadge.innerText = `${count} baris terdeteksi`;
    lineCountBadge.classList.remove('hidden');
  } else {
    lineCountBadge.classList.add('hidden');
  }
}

function renderApp() {
  rawTextInput.value = state.rawText;
  updateLineCountBadge();

  const total = state.rows.length;
  const fatCount = state.rows.filter((r) => r.isHeading).length;
  const itemCount = total - fatCount;

  statTotalRows.innerText = total;
  statFatCount.innerText = fatCount;

  countFilterAll.innerText = total;
  countFilterFat.innerText = fatCount;
  countFilterItem.innerText = itemCount;

  const isDisabled = total === 0;
  btnCopyText.disabled = isDisabled;
  btnExportDocx.disabled = isDisabled;

  if (total > 0) {
    exportHelperText.innerText = `${total} baris siap di-export ke DOCX atau disalin ke Word`;
  } else {
    exportHelperText.innerText = 'List masih kosong. Masukkan dan proses teks mentah terlebih dahulu.';
  }

  renderRowsList();
}

function renderRowsList() {
  rowsContainer.innerHTML = '';

  const filtered = state.rows.filter((row) => {
    const matchesSearch = row.text.toLowerCase().includes(state.searchQuery.toLowerCase());
    if (state.filterType === 'heading') return matchesSearch && row.isHeading;
    if (state.filterType === 'item') return matchesSearch && !row.isHeading;
    return matchesSearch;
  });

  if (filtered.length === 0) {
    emptyState.classList.remove('hidden');
    rowsContainer.classList.add('hidden');
  } else {
    emptyState.classList.add('hidden');
    rowsContainer.classList.remove('hidden');

    filtered.forEach((row, index) => {
      const originalIndex = state.rows.findIndex((r) => r.id === row.id);
      const statusInfo = detectStatusFromText(row.text);
      const isDeaktivasi = statusInfo.statusType === 'deaktivasi';
      const isPeriode = statusInfo.statusType === 'periode';
      const isPeriodOpen = state.activePeriodRowId === row.id;

      const isEven = originalIndex % 2 === 0;
      const noStatus = statusInfo.statusType === 'none' && !row.isHeading;
      
      const serviceIdMatch = row.text.match(/(?:#\d+\s+)?(\d{5,})/);
      const serviceId = (!row.isHeading && serviceIdMatch) ? serviceIdMatch[1] : null;

      let isAnomaly = false;
      if (state.settings.enableAnomalyNoServiceId && !row.isHeading && !serviceId) {
        isAnomaly = true;
      }
      if (state.settings.enableAnomalyPeriod && isPeriode) {
        const datesMatch = statusInfo.periodText.match(/(\d{4}-\d{2}-\d{2})\s*[-–]\s*(\d{4}-\d{2}-\d{2})/);
        if (datesMatch) {
          const endDateMatch = datesMatch[2].match(/^(\d{4})-(\d{2})-\d{2}$/);
          if (endDateMatch) {
            const endYear = parseInt(endDateMatch[1], 10);
            const endMonth = parseInt(endDateMatch[2], 10);
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth() + 1;
            
            const monthsDiff = (currentYear * 12 + currentMonth) - (endYear * 12 + endMonth);
            if (monthsDiff === 1) {
              isAnomaly = true;
            }
          }
        }
      }

      const showHighlightNoStatus = state.settings.enableHighlightNoStatus && noStatus;

      const rowEl = document.createElement('div');
      rowEl.setAttribute('draggable', 'false');
      rowEl.className = `group relative flex flex-col gap-3 p-3.5 rounded-xl border transition-all cursor-default ${
        isAnomaly
          ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-500/50 hover:bg-rose-100 dark:hover:bg-rose-900/50 ring-1 ring-rose-500/30 shadow-md shadow-rose-900/20'
          : row.isHeading
            ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-500/40 hover:bg-indigo-100 dark:hover:border-indigo-500/60 shadow-md shadow-indigo-950/30'
            : showHighlightNoStatus
              ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-500/40 hover:bg-amber-100 dark:hover:bg-amber-900/30 ring-1 ring-amber-500/20 shadow-md shadow-amber-900/10'
              : isEven
                ? 'bg-slate-100 dark:bg-slate-900/70 border-slate-200 dark:border-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800/70'
                : 'bg-slate-50 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-900/80'
      }`;

      rowEl.innerHTML = `
        <!-- Main Row Content Bar -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full min-w-0">
          <div class="flex items-center gap-2.5 flex-1 min-w-0">
            <div class="drag-handle cursor-grab active:cursor-grabbing p-1.5 text-slate-500 dark:text-slate-500 hover:text-cyan-600 dark:text-cyan-400 hover:bg-slate-100 dark:bg-slate-800/80 rounded-lg transition-colors shrink-0" title="Tarik / Drag khusus dari ikon ini untuk geser baris">
              <i data-lucide="grip-vertical" class="w-4 h-4"></i>
            </div>

            <span class="text-xs font-mono text-slate-500 dark:text-slate-500 w-6 text-right shrink-0">#${originalIndex + 1}</span>
            
            <button
              type="button"
              title="Klik untuk mengubah tipe: Kode FAT / List biasa"
              class="btn-toggle-type shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 ${row.isHeading
          ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-500/40 hover:bg-indigo-200 dark:hover:bg-indigo-500/30'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-200'
        }"
            >
              <i data-lucide="tag" class="w-3 h-3"></i>
              <span>${row.isHeading ? 'KODE FAT' : 'PELANGGAN'}</span>
            </button>

            <div class="flex-1 min-w-0">
              ${state.editingRowId === row.id
          ? `<div class="flex items-center gap-2">
                      <input type="text" value="${escapeHtml(row.text)}" class="input-inline-edit w-full bg-slate-50 dark:bg-slate-950 border border-cyan-300 dark:border-cyan-500/60 rounded-lg px-3 py-1.5 text-sm font-mono text-cyan-800 dark:text-cyan-200 focus:outline-none" />
                      <button type="button" class="btn-save-inline p-1.5 rounded-lg bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/30">
                        <i data-lucide="check" class="w-4 h-4"></i>
                      </button>
                     </div>`
          : `<div class="btn-start-edit cursor-pointer px-2 py-1 rounded hover:bg-slate-100 dark:bg-slate-800/60 transition-colors flex items-center justify-between group/text ${row.isHeading
            ? 'font-bold text-indigo-800 dark:text-indigo-200 text-base font-mono tracking-wide'
            : 'text-sm text-slate-900 dark:text-slate-200 font-mono'
          }">
                      <span class="truncate">${escapeHtml(row.text)}</span>
                      <i data-lucide="edit-3" class="w-3.5 h-3.5 text-slate-500 dark:text-slate-500 opacity-0 group-hover/text:opacity-100 transition-opacity ml-2 shrink-0"></i>
                     </div>`
        }
            </div>
          </div>

          <div class="flex flex-wrap items-center justify-end gap-2 shrink-0">
            ${(state.settings.enableCopyServiceId && serviceId) ? `
            <button
              type="button"
              class="btn-copy-service-id p-1.5 rounded-lg text-indigo-400 hover:text-indigo-300 hover:bg-indigo-50 dark:bg-indigo-950/60 border border-transparent hover:border-indigo-800/50 transition-colors"
              title="Copy Service ID: ${serviceId}"
              data-serviceid="${serviceId}"
            >
              <i data-lucide="copy" class="w-4 h-4"></i>
            </button>
            ` : ''}
            <button
              type="button"
              class="btn-toggle-deaktivasi inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${isDeaktivasi
          ? 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700/80 shadow-sm shadow-rose-950/40 font-semibold'
          : 'bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700/60 hover:bg-rose-50 dark:bg-rose-950/40 hover:text-rose-700 dark:text-rose-300 hover:border-rose-800/50'
        }"
            >
              <i data-lucide="power-off" class="w-3.5 h-3.5 text-rose-600 dark:text-rose-400"></i>
              <span>Deaktivasi</span>
              ${isDeaktivasi ? '<i data-lucide="check" class="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 ml-0.5"></i>' : ''}
            </button>

            <button
              type="button"
              class="btn-toggle-periode inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${isPeriode
          ? 'bg-cyan-50 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700/80 shadow-sm shadow-cyan-950/40 font-semibold'
          : 'bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700/60 hover:bg-cyan-50 dark:bg-cyan-950/40 hover:text-cyan-700 dark:text-cyan-300 hover:border-cyan-800/50'
        }"
            >
              <i data-lucide="calendar" class="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400"></i>
              <span>Periode</span>
              ${isPeriode ? '<i data-lucide="check" class="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 ml-0.5"></i>' : ''}
            </button>

            <button
              type="button"
              class="btn-delete-row p-1.5 rounded-lg text-slate-500 dark:text-slate-500 hover:text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:bg-rose-950/60 border border-transparent hover:border-rose-800/50 transition-colors ml-1"
              title="Hapus baris ini"
            >
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </div>

        <!-- Period Input Sub-Panel -->
        ${isPeriodOpen
          ? `<div class="w-full pt-3 mt-1 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row items-center gap-2.5">
                <div class="flex items-center gap-2 flex-1 w-full text-xs">
                  <span class="text-cyan-600 dark:text-cyan-400 shrink-0 font-medium flex items-center gap-1">
                    <i data-lucide="calendar" class="w-3.5 h-3.5"></i>
                    Periode:
                  </span>
                  <input
                    type="text"
                    placeholder="Paste teks periode, contoh: 2025-10-29 - 2025-11-28"
                    value="${escapeHtml(statusInfo.periodText || '2025-10-29 - 2025-11-28')}"
                    class="input-period-text flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 rounded-lg px-3 py-1.5 text-xs font-mono text-cyan-800 dark:text-cyan-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-300 dark:border-cyan-500"
                  />
                </div>
                <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button type="button" class="btn-period-paste px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium inline-flex items-center gap-1 border border-slate-300 dark:border-slate-700 transition-colors">
                    <i data-lucide="clipboard" class="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400"></i>
                    Paste
                  </button>
                  <button type="button" class="btn-period-apply px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors">
                    Terapkan
                  </button>
                  ${isPeriode
            ? `<button type="button" class="btn-period-clear px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 text-rose-700 dark:text-rose-300 text-xs transition-colors">Hapus Suffix</button>`
            : ''
          }
                  <button type="button" class="btn-period-close p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-200" title="Tutup">
                    <i data-lucide="x" class="w-4 h-4"></i>
                  </button>
                </div>
               </div>`
          : ''
        }
      `;

      // Enable HTML5 Drag ONLY on mousedown of the .drag-handle icon
      const dragHandle = rowEl.querySelector('.drag-handle');
      dragHandle.addEventListener('mousedown', () => {
        rowEl.setAttribute('draggable', 'true');
      });

      dragHandle.addEventListener('mouseleave', () => {
        setTimeout(() => {
          if (state.draggedIndex !== originalIndex) {
            rowEl.setAttribute('draggable', 'false');
          }
        }, 200);
      });

      rowEl.addEventListener('dragstart', (e) => {
        state.draggedIndex = originalIndex;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', originalIndex);
        rowEl.classList.add('opacity-40', 'border-cyan-300', 'dark:border-cyan-500/80');
      });

      rowEl.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        const rect = rowEl.getBoundingClientRect();
        const relativeY = (e.clientY - rect.top) / rect.height;

        // Clear previous drag indicators
        rowEl.classList.remove(
          'border-t-4', 'border-b-4', 'border-cyan-400',
          'ring-2', 'ring-indigo-400', 'bg-indigo-50', 'dark:bg-indigo-950/80',
          'shadow-[0_-6px_15px_rgba(6,182,212,0.8)]',
          'shadow-[0_6px_15px_rgba(6,182,212,0.8)]',
          'shadow-[0_0_20px_rgba(99,102,241,0.5)]'
        );

        if (relativeY < 0.25) {
          // Insert Before Line Indicator
          rowEl.classList.add('border-t-4', 'border-cyan-400', 'shadow-[0_-6px_15px_rgba(6,182,212,0.8)]');
        } else if (relativeY > 0.75) {
          // Insert After Line Indicator
          rowEl.classList.add('border-b-4', 'border-cyan-400', 'shadow-[0_6px_15px_rgba(6,182,212,0.8)]');
        } else {
          // Swap Positions Highlight Box
          rowEl.classList.add('ring-2', 'ring-indigo-400', 'bg-indigo-50', 'dark:bg-indigo-950/80', 'shadow-[0_0_20px_rgba(99,102,241,0.5)]');
        }
      });

      rowEl.addEventListener('dragleave', () => {
        rowEl.classList.remove(
          'border-t-4', 'border-b-4', 'border-cyan-400',
          'ring-2', 'ring-indigo-400', 'bg-indigo-50', 'dark:bg-indigo-950/80',
          'shadow-[0_-6px_15px_rgba(6,182,212,0.8)]',
          'shadow-[0_6px_15px_rgba(6,182,212,0.8)]',
          'shadow-[0_0_20px_rgba(99,102,241,0.5)]'
        );
      });

      rowEl.addEventListener('drop', (e) => {
        e.preventDefault();
        rowEl.classList.remove(
          'border-t-4', 'border-b-4', 'border-cyan-400',
          'ring-2', 'ring-indigo-400', 'bg-indigo-50', 'dark:bg-indigo-950/80',
          'shadow-[0_-6px_15px_rgba(6,182,212,0.8)]',
          'shadow-[0_6px_15px_rgba(6,182,212,0.8)]',
          'shadow-[0_0_20px_rgba(99,102,241,0.5)]'
        );

        const fromIndex = state.draggedIndex;
        const targetIndex = originalIndex;

        if (fromIndex !== null && fromIndex !== undefined && fromIndex !== targetIndex) {
          const rect = rowEl.getBoundingClientRect();
          const relativeY = (e.clientY - rect.top) / rect.height;

          if (relativeY >= 0.25 && relativeY <= 0.75) {
            // SWAP POSITIONS
            const temp = state.rows[fromIndex];
            state.rows[fromIndex] = state.rows[targetIndex];
            state.rows[targetIndex] = temp;
          } else {
            // INSERT IN BETWEEN (BEFORE / AFTER)
            const isBefore = relativeY < 0.25;
            let insertIndex = isBefore ? targetIndex : targetIndex + 1;

            const [movedRow] = state.rows.splice(fromIndex, 1);
            let adjustedIndex = insertIndex;
            if (fromIndex < insertIndex) {
              adjustedIndex = insertIndex - 1;
            }

            state.rows.splice(adjustedIndex, 0, movedRow);
          }

          saveRows();
          syncRawTextFromRows();
          renderApp();
        }
      });

      rowEl.addEventListener('dragend', () => {
        rowEl.setAttribute('draggable', 'false');
        rowEl.classList.remove(
          'opacity-40', 'border-cyan-300', 'dark:border-cyan-500/80',
          'border-t-4', 'border-b-4', 'border-cyan-400',
          'ring-2', 'ring-indigo-400', 'bg-indigo-50', 'dark:bg-indigo-950/80',
          'shadow-[0_-6px_15px_rgba(6,182,212,0.8)]',
          'shadow-[0_6px_15px_rgba(6,182,212,0.8)]',
          'shadow-[0_0_20px_rgba(99,102,241,0.5)]'
        );
        state.draggedIndex = null;
      });

      // Row Actions Setup
      rowEl.querySelector('.btn-toggle-type').addEventListener('click', () => {
        row.isHeading = !row.isHeading;
        saveRows();
        renderApp();
      });

      const startEditBtn = rowEl.querySelector('.btn-start-edit');
      if (startEditBtn) {
        startEditBtn.addEventListener('click', () => {
          state.editingRowId = row.id;
          renderRowsList();
        });
      }

      const inlineInput = rowEl.querySelector('.input-inline-edit');
      if (inlineInput) {
        inlineInput.focus();
        const saveInline = () => {
          const newText = inlineInput.value.trim();
          if (newText) {
            row.text = newText;
            saveRows();
            syncRawTextFromRows();
          }
          state.editingRowId = null;
          renderApp();
        };
        inlineInput.addEventListener('blur', saveInline);
        inlineInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') saveInline();
          if (e.key === 'Escape') {
            state.editingRowId = null;
            renderRowsList();
          }
        });
      }

      rowEl.querySelector('.btn-toggle-deaktivasi').addEventListener('click', () => {
        if (isDeaktivasi) {
          row.text = stripStatusSuffix(row.text);
        } else {
          row.text = formatStatusText(row.text, 'deaktivasi');
        }
        state.activePeriodRowId = null;
        saveRows();
        syncRawTextFromRows();
        renderApp();
      });

      const copyServiceIdBtn = rowEl.querySelector('.btn-copy-service-id');
      if (copyServiceIdBtn) {
        copyServiceIdBtn.addEventListener('click', async () => {
          const sId = copyServiceIdBtn.dataset.serviceid;
          if (!sId) return;
          try {
            await navigator.clipboard.writeText(sId);
            const originalHtml = copyServiceIdBtn.innerHTML;
            copyServiceIdBtn.innerHTML = '<i data-lucide="check" class="w-4 h-4 text-emerald-400"></i>';
            if (window.lucide) window.lucide.createIcons();
            setTimeout(() => {
              copyServiceIdBtn.innerHTML = originalHtml;
              if (window.lucide) window.lucide.createIcons();
            }, 1500);
          } catch (err) {
            console.error('Failed to copy service id:', err);
          }
        });
      }

      rowEl.querySelector('.btn-toggle-periode').addEventListener('click', () => {
        state.activePeriodRowId = state.activePeriodRowId === row.id ? null : row.id;
        renderRowsList();
      });

      rowEl.querySelector('.btn-delete-row').addEventListener('click', () => {
        const deleteRowAction = () => {
          state.rows = state.rows.filter((r) => r.id !== row.id);
          saveRows();
          syncRawTextFromRows();
          renderApp();
        };

        if (state.settings.enableFatCodeConfirm && row.isHeading) {
          Swal.fire({
            title: 'Hapus Kode FAT?',
            text: 'Anda yakin ingin menghapus kode FAT ini dari daftar?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e11d48',
            cancelButtonColor: '#334155',
            confirmButtonText: 'Ya, Hapus',
            cancelButtonText: 'Batal',
            background: '#0f172a',
            color: '#f1f5f9'
          }).then((result) => {
            if (result.isConfirmed) {
              deleteRowAction();
            }
          });
        } else {
          deleteRowAction();
        }
      });

      // Period input events
      if (isPeriodOpen) {
        const periodField = rowEl.querySelector('.input-period-text');
        periodField.focus();
        setTimeout(() => {
          rowEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 50);

        const applyPeriod = (val) => {
          const txt = val !== undefined ? val : periodField.value.trim();
          if (txt) {
            row.text = formatStatusText(row.text, 'periode', txt);
            saveRows();
            syncRawTextFromRows();
          }
          state.activePeriodRowId = null;
          renderApp();
        };

        rowEl.querySelector('.btn-period-apply').addEventListener('click', () => applyPeriod());
        periodField.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') applyPeriod();
          if (e.key === 'Escape') {
            state.activePeriodRowId = null;
            renderRowsList();
          }
        });

        rowEl.querySelector('.btn-period-paste').addEventListener('click', async () => {
          try {
            const clip = await navigator.clipboard.readText();
            if (clip.trim()) {
              const cleaned = clip.trim().replace(/^\(|\)$/g, '');
              periodField.value = cleaned;
              applyPeriod(cleaned);
            }
          } catch (err) {
            console.error('Clipboard paste error:', err);
          }
        });

        const clearPeriodBtn = rowEl.querySelector('.btn-period-clear');
        if (clearPeriodBtn) {
          clearPeriodBtn.addEventListener('click', () => {
            row.text = stripStatusSuffix(row.text);
            state.activePeriodRowId = null;
            saveRows();
            syncRawTextFromRows();
            renderApp();
          });
        }

        rowEl.querySelector('.btn-period-close').addEventListener('click', () => {
          state.activePeriodRowId = null;
          renderRowsList();
        });
      }

      rowsContainer.appendChild(rowEl);
    });
  }

  // Refresh Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Initial Render
renderApp();

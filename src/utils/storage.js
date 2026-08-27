const STORAGE_KEY_RAW = 'formatter_raw_text';
const STORAGE_KEY_ROWS = 'formatter_rows';

export const getStoredRawText = () => {
  try {
    return localStorage.getItem(STORAGE_KEY_RAW) || '';
  } catch (err) {
    console.error('Failed to get raw text from localStorage:', err);
    return '';
  }
};

export const setStoredRawText = (text) => {
  try {
    localStorage.setItem(STORAGE_KEY_RAW, text);
  } catch (err) {
    console.error('Failed to save raw text to localStorage:', err);
  }
};

export const getStoredRows = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY_ROWS);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error('Failed to get rows from localStorage:', err);
    return null;
  }
};

export const setStoredRows = (rows) => {
  try {
    localStorage.setItem(STORAGE_KEY_ROWS, JSON.stringify(rows));
  } catch (err) {
    console.error('Failed to save rows to localStorage:', err);
  }
};

export const clearStoredData = () => {
  try {
    localStorage.removeItem(STORAGE_KEY_RAW);
    localStorage.removeItem(STORAGE_KEY_ROWS);
  } catch (err) {
    console.error('Failed to clear stored data:', err);
  }
};

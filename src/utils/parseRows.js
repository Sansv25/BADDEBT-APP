/**
 * Checks if a string line is heuristically a FAT code heading.
 * Rule per PRD §6:
 * Does not start with '#' AND does not contain spaces.
 * Example: 'DPRA036', 'DPRF009', 'TABA1153' -> true
 * '#1 55100...' or 'add 1:2' or '#7 pindah...' -> false
 */
export const isFatHeading = (lineText) => {
  const trimmed = lineText.trim();
  if (!trimmed) return false;
  return !trimmed.startsWith('#') && !/\s/.test(trimmed);
};

/**
 * Cleans any existing status suffix (e.g. '(Deaktivasi)' or '(YYYY-MM-DD - YYYY-MM-DD)') from base text.
 */
export const stripStatusSuffix = (text) => {
  if (!text) return '';
  return text
    .replace(/\s*\(\s*deaktivasi\s*\)$/i, '')
    .replace(/\s*\(\s*\d{4}-\d{2}-\d{2}\s*[-–]\s*\d{4}-\d{2}-\d{2}\s*\)$/i, '')
    .trim();
};

/**
 * Detects existing status type and detail from row text.
 */
export const detectStatusFromText = (text) => {
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
};

/**
 * Builds formatted text string from baseText and period string.
 */
export const formatStatusText = (baseText, statusType, periodText = '') => {
  const clean = stripStatusSuffix(baseText);
  if (statusType === 'deaktivasi') {
    return `${clean} (Deaktivasi)`;
  }
  if (statusType === 'periode' && periodText.trim()) {
    return `${clean} (${periodText.trim()})`;
  }
  return clean;
};

/**
 * Normalizes line string:
 * 1. Collapses multiple inner spaces into one space.
 * 2. Standardizes '(DEAKTIVASI)' casing to '(Deaktivasi)'.
 */
export const cleanAndNormalizeLine = (line) => {
  if (!line) return '';
  let cleaned = line.trim().replace(/[ \t]+/g, ' ');
  cleaned = cleaned.replace(/\(\s*deaktivasi\s*\)$/i, '(Deaktivasi)');
  return cleaned;
};

/**
 * Checks if a line is a bare number stub like "#8", "#12 ", "#" without any customer ID or text.
 */
export const isBareNumberStub = (line) => {
  const trimmed = line.trim();
  return /^#\d*\s*$/.test(trimmed);
};

/**
 * Parses raw pasted string into an array of editable row objects.
 * Filters out empty lines and bare number stubs (like "#8 ").
 */
export const parseRawTextToRows = (rawText) => {
  if (!rawText) return [];

  const lines = rawText.split(/\r?\n/);
  const rows = [];

  lines.forEach((line) => {
    const cleaned = cleanAndNormalizeLine(line);
    // Skip empty lines and incomplete bare number stubs like "#8 "
    if (cleaned.length > 0 && !isBareNumberStub(cleaned)) {
      rows.push({
        id: 'row_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now(),
        text: cleaned,
        isHeading: isFatHeading(cleaned),
      });
    }
  });

  return rows;
};

/**
 * Prepares sample raw data with deactivation & period examples for quick testing.
 */
export const SAMPLE_RAW_TEXT = `DPRA160
#1 551002266985 Riko Pramanto
#2 130091822 Natasha Shannon
#3 5510022669850 Norma Arindri Dangkua (DEAKTIVASI)
#4 551000192033 I Ketut Dedik Mahardika
#5 55100226698500 Anasthasia Putri Sudarsono
#6 551004889297 Ida Made Ara Runa
#7 551002266985000 Ester
#8 `;

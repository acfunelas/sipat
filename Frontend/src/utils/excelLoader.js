import * as XLSX from 'xlsx';

const CACHE_KEY = 'sipat-excel-cache';
const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const safeLocalStorage = {
  getItem: (key) => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // ignore quota or private mode storage issues
    }
  },
  removeItem: (key) => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
};

const toArrayBufferFromBase64 = (base64) => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i += 1) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

const saveWorkbookToCache = (arrayBuffer) => {
  try {
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i += 1) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    safeLocalStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        timestamp: Date.now(),
        data: base64
      })
    );
  } catch {
    // ignore cache storage failures
  }
};

export const getCachedWorkbook = (forceRefresh = false) => {
  if (forceRefresh) {
    safeLocalStorage.removeItem(CACHE_KEY);
    return null;
  }

  const raw = safeLocalStorage.getItem(CACHE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.data) return null;

    const age = Date.now() - Number(parsed.timestamp || 0);
    if (age > CACHE_MAX_AGE_MS) {
      safeLocalStorage.removeItem(CACHE_KEY);
      return null;
    }

    return toArrayBufferFromBase64(parsed.data);
  } catch {
    safeLocalStorage.removeItem(CACHE_KEY);
    return null;
  }
};

export const normalizeGoogleDriveUrl = (url) => {
  if (!url) return url;

  const driveFileMatch = url.match(/\/file\/d\/([^/]+)/i) || url.match(/[?&]id=([^&]+)/i);
  if (driveFileMatch && driveFileMatch[1]) {
    return `https://drive.google.com/uc?export=download&id=${driveFileMatch[1]}`;
  }

  return url;
};

export const normalizeSharePointUrl = (url) => {
  if (!url) return url;

  const trimmedUrl = url.trim();
  if (!trimmedUrl.includes('sharepoint.com')) return trimmedUrl;
  if (trimmedUrl.includes('download=1')) return trimmedUrl;

  const separator = trimmedUrl.includes('?') ? '&' : '?';
  return `${trimmedUrl}${separator}download=1`;
};

export const fetchAndParseExcel = async (sourceUrl, sourceLabel = 'Excel file', forceRefresh = false) => {
  const cachedWorkbook = getCachedWorkbook(forceRefresh);
  if (cachedWorkbook) {
    const workbook = XLSX.read(cachedWorkbook, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { defval: null });

    return {
      sourceLabel,
      sheetName: firstSheetName,
      rows,
      workbook,
      cacheHit: true
    };
  }

  const resolvedUrl = normalizeSharePointUrl(normalizeGoogleDriveUrl(sourceUrl));
  const response = await fetch(resolvedUrl, {
    method: 'GET',
    mode: 'cors'
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${sourceLabel}: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  saveWorkbookToCache(arrayBuffer);

  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { defval: null });

  return {
    sourceLabel,
    sheetName: firstSheetName,
    rows,
    workbook,
    cacheHit: false
  };
};

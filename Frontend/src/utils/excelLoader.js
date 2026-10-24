import * as XLSX from 'xlsx';

const LEGACY_CACHE_KEYS = [
  'sipat-s3-excel-cache-v3',
  'sipat-sharepoint-excel-cache-v2',
  'sipat-excel-cache',
];

const safeLocalStorage = {
  removeItem: (key) => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
};

const clearLegacyWorkbookCaches = () => {
  LEGACY_CACHE_KEYS.forEach(safeLocalStorage.removeItem);
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
  const isRemoteWorkbook = /^https?:\/\//i.test(sourceUrl);
  clearLegacyWorkbookCaches();

  const resolvedUrl = normalizeSharePointUrl(normalizeGoogleDriveUrl(sourceUrl));
  const requestUrl = isRemoteWorkbook
    ? `${resolvedUrl}${resolvedUrl.includes('?') ? '&' : '?'}_sipat_refresh=${Date.now()}`
    : resolvedUrl;
  const response = await fetch(requestUrl, {
    method: 'GET',
    mode: 'cors',
    cache: forceRefresh ? 'reload' : 'no-store'
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${sourceLabel}: ${response.status} ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();

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

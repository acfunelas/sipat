import * as XLSX from 'xlsx';
import { fetchAndParseExcel } from './excelLoader';

const workbookBuffer = (() => {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet([{ school_id: 307930 }]),
    'schools'
  );
  const bytes = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  const byteView = bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : bytes;
  return byteView.buffer.slice(byteView.byteOffset, byteView.byteOffset + byteView.byteLength);
})();

const successfulResponse = () => ({
  ok: true,
  arrayBuffer: async () => workbookBuffer,
});

beforeEach(() => {
  window.localStorage.clear();
  global.fetch = jest.fn().mockResolvedValue(successfulResponse());
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('does not use bundled fallback data as a remote S3 cache entry', async () => {
  await fetchAndParseExcel('/sipatdatabase.xlsx', 'Bundled fallback workbook');
  await fetchAndParseExcel(
    'https://s3-deped-laguna-sipat.s3.ap-southeast-2.amazonaws.com/1+SIPAT+Database.xlsx',
    'S3 SIPAT Database'
  );

  expect(global.fetch).toHaveBeenCalledTimes(2);
  expect(global.fetch.mock.calls[0][0]).toBe('/sipatdatabase.xlsx');
  expect(global.fetch.mock.calls[0][1].cache).toBe('no-store');
  expect(global.fetch.mock.calls[1][0]).toContain('s3-deped-laguna-sipat.s3.ap-southeast-2.amazonaws.com');
});

test('bypasses the S3 cache and HTTP cache when manually refreshed', async () => {
  const sourceUrl = 'https://s3-deped-laguna-sipat.s3.ap-southeast-2.amazonaws.com/1+SIPAT+Database.xlsx';
  await fetchAndParseExcel(sourceUrl, 'S3 SIPAT Database');
  await fetchAndParseExcel(sourceUrl, 'S3 SIPAT Database', true);

  expect(global.fetch).toHaveBeenCalledTimes(2);
  expect(global.fetch.mock.calls[1][1].cache).toBe('reload');
});

test('always fetches the latest remote workbook rather than reusing stored data', async () => {
  window.localStorage.setItem('sipat-s3-excel-cache-v3', JSON.stringify({
    timestamp: Date.now(),
    data: 'stale-data',
  }));
  window.localStorage.setItem('sipat-sharepoint-excel-cache-v2', JSON.stringify({
    timestamp: Date.now(),
    data: 'stale-sharepoint-data',
  }));

  await fetchAndParseExcel(
    'https://s3-deped-laguna-sipat.s3.ap-southeast-2.amazonaws.com/1+SIPAT+Database.xlsx',
    'S3 SIPAT Database'
  );

  expect(global.fetch).toHaveBeenCalledTimes(1);
  expect(global.fetch.mock.calls[0][1].cache).toBe('no-store');
  expect(global.fetch.mock.calls[0][0]).toContain('_sipat_refresh=');
  expect(window.localStorage.getItem('sipat-s3-excel-cache-v3')).toBeNull();
  expect(window.localStorage.getItem('sipat-sharepoint-excel-cache-v2')).toBeNull();
});

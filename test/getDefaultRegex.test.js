import { describe, it, expect } from 'vitest';

// Pure-function copy from options.js
const CURRENCY_PATTERNS = {
  AUD: { symbols: ['A\\$', 'AU\\$', 'AUD'] },
  BRL: { symbols: ['R\\$', 'BRL'] },
  CAD: { symbols: ['C\\$', 'CA\\$', 'CAD'] },
  CHF: { symbols: ['CHF', 'Fr\\.'] },
  CNY: { symbols: ['¥', 'CN¥', 'CNY', 'RMB'] },
  CZK: { symbols: ['Kč', 'CZK'] },
  DKK: { symbols: ['kr\\.?', 'DKK'] },
  EUR: { symbols: ['€', 'EUR'] },
  GBP: { symbols: ['£', 'GBP'] },
  HKD: { symbols: ['HK\\$', 'HKD'] },
  HUF: { symbols: ['Ft', 'HUF'] },
  IDR: { symbols: ['Rp\\.?', 'IDR'] },
  ILS: { symbols: ['₪', 'NIS', 'ILS'] },
  INR: { symbols: ['₹', 'Rs\\.?', 'INR'] },
  ISK: { symbols: ['kr\\.?', 'ISK'] },
  JPY: { symbols: ['¥', 'Yen', 'JPY'] },
  KRW: { symbols: ['₩', 'KRW'] },
  MXN: { symbols: ['MX\\$', 'MXN'] },
  MYR: { symbols: ['RM', 'MYR'] },
  NOK: { symbols: ['kr\\.?', 'NOK'] },
  NZD: { symbols: ['NZ\\$', 'NZD'] },
  PHP: { symbols: ['₱', 'PHP'] },
  PLN: { symbols: ['zł', 'PLN'] },
  RON: { symbols: ['lei', 'RON'] },
  SEK: { symbols: ['kr\\.?', 'SEK'] },
  SGD: { symbols: ['S\\$', 'SG\\$', 'SGD'] },
  THB: { symbols: ['฿', 'THB'] },
  TRY: { symbols: ['₺', 'TL', 'TRY'] },
  USD: { symbols: ['\\$', 'US\\$', 'USD'] },
  ZAR: { symbols: ['R(?=\\d)', 'ZAR'] },
};

function getDefaultRegex(currency) {
  const patterns = CURRENCY_PATTERNS[currency];
  if (!patterns) return '';
  const group = patterns.symbols.join('|');
  return `(?:${group})\\s*([\\d,.]+)|([\\d,.]+)\\s*(?:${group})`;
}

describe('getDefaultRegex', () => {
  it('returns expected pattern for USD', () => {
    const result = getDefaultRegex('USD');
    expect(result).toBe('(?:\\$|US\\$|USD)\\s*([\\d,.]+)|([\\d,.]+)\\s*(?:\\$|US\\$|USD)');
  });

  it('returns expected pattern for EUR', () => {
    const result = getDefaultRegex('EUR');
    expect(result).toBe('(?:€|EUR)\\s*([\\d,.]+)|([\\d,.]+)\\s*(?:€|EUR)');
  });

  it('returns expected pattern for JPY', () => {
    const result = getDefaultRegex('JPY');
    expect(result).toBe('(?:¥|Yen|JPY)\\s*([\\d,.]+)|([\\d,.]+)\\s*(?:¥|Yen|JPY)');
  });

  it('returns empty string for unknown currency code', () => {
    expect(getDefaultRegex('XXX')).toBe('');
    expect(getDefaultRegex('FAKE')).toBe('');
  });

  it('returns empty string for undefined/null', () => {
    expect(getDefaultRegex(undefined)).toBe('');
    expect(getDefaultRegex(null)).toBe('');
  });

  it('produces a valid regex for every known currency', () => {
    for (const code of Object.keys(CURRENCY_PATTERNS)) {
      const pattern = getDefaultRegex(code);
      expect(pattern).toBeTruthy();
      expect(() => new RegExp(pattern, 'gi')).not.toThrow();
    }
  });
});

import { describe, it, expect } from 'vitest';

// Pure-function copies from content.js (small, stable, avoids build tooling)
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

function buildRegex(currency) {
  const patterns = CURRENCY_PATTERNS[currency];
  if (!patterns) return null;
  const group = patterns.symbols.join('|');
  return new RegExp(
    `(?:${group})\\s*([\\d,.]+)|([\\d,.]+)\\s*(?:${group})`,
    'gi'
  );
}

// Helper: test if regex matches a string and captures a number
function matches(regex, str) {
  regex.lastIndex = 0;
  return regex.test(str);
}

describe('buildRegex', () => {
  describe('JPY', () => {
    it('matches ¥1,200', () => {
      expect(matches(buildRegex('JPY'), '¥1,200')).toBe(true);
    });
    it('matches 13870 JPY', () => {
      expect(matches(buildRegex('JPY'), '13870 JPY')).toBe(true);
    });
    it('matches Yen 500', () => {
      expect(matches(buildRegex('JPY'), 'Yen 500')).toBe(true);
    });
  });

  describe('USD', () => {
    it('matches $4.50', () => {
      expect(matches(buildRegex('USD'), '$4.50')).toBe(true);
    });
    it('matches US$155.88', () => {
      expect(matches(buildRegex('USD'), 'US$155.88')).toBe(true);
    });
    it('matches USD 999', () => {
      expect(matches(buildRegex('USD'), 'USD 999')).toBe(true);
    });
  });

  describe('GBP', () => {
    it('matches £6.50', () => {
      expect(matches(buildRegex('GBP'), '£6.50')).toBe(true);
    });
    it('matches GBP 34963', () => {
      expect(matches(buildRegex('GBP'), 'GBP 34963')).toBe(true);
    });
  });

  describe('INR', () => {
    it('matches ₹80', () => {
      expect(matches(buildRegex('INR'), '₹80')).toBe(true);
    });
    it('matches Rs.250', () => {
      expect(matches(buildRegex('INR'), 'Rs.250')).toBe(true);
    });
    it('matches INR 1200000', () => {
      expect(matches(buildRegex('INR'), 'INR 1200000')).toBe(true);
    });
  });

  describe('BRL', () => {
    it('matches R$18', () => {
      expect(matches(buildRegex('BRL'), 'R$18')).toBe(true);
    });
    it('matches BRL 230', () => {
      expect(matches(buildRegex('BRL'), 'BRL 230')).toBe(true);
    });
  });

  it('returns null for null/unknown currency', () => {
    expect(buildRegex(null)).toBe(null);
    expect(buildRegex('XXX')).toBe(null);
  });

  it('every currency in CURRENCY_PATTERNS produces a valid regex', () => {
    for (const code of Object.keys(CURRENCY_PATTERNS)) {
      expect(() => buildRegex(code)).not.toThrow();
      expect(buildRegex(code)).toBeInstanceOf(RegExp);
    }
  });

  it('does NOT match bare numbers without currency symbols', () => {
    const re = buildRegex('USD');
    expect(matches(re, '1234')).toBe(false);
    expect(matches(re, '99.99')).toBe(false);
  });
});

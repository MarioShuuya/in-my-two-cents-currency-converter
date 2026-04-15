import { describe, it, expect } from 'vitest';

// Pure-function copies from content.js to avoid browser-API dependencies

const CURRENCY_PATTERNS = {
  JPY: { symbols: ['¥', 'Yen', 'JPY'], locale: 'ja-JP' },
  USD: { symbols: ['\\$', 'US\\$', 'USD'], locale: 'en-US' },
  EUR: { symbols: ['€', 'EUR'], locale: 'de-DE' },
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

const CONVERTED_MARKER = '\u200B';
const MAX_MATCHES_PER_NODE = 50;
const MAX_MATCH_LENGTH = 100;

/**
 * Simulates replaceTextInNode on a plain string instead of a DOM text node.
 * Returns the resulting string.
 */
function replaceText(text, sourceCurrency, rate, targetCurrency) {
  const regex = buildRegex(sourceCurrency);
  if (!regex) return text;

  if (text.includes(CONVERTED_MARKER)) return text;

  const patterns = CURRENCY_PATTERNS[targetCurrency];
  const locale = patterns ? patterns.locale : 'en-US';
  const formatter = new Intl.NumberFormat(locale, { style: 'currency', currency: targetCurrency });

  regex.lastIndex = 0;
  let matchCount = 0;
  return text.replace(regex, (match, p1, p2) => {
    if (++matchCount > MAX_MATCHES_PER_NODE) return match;
    if (match.length > MAX_MATCH_LENGTH) return match;

    const numberString = p1 || p2;
    if (!numberString) return match;
    const cleanNumber = parseFloat(numberString.replace(/,/g, ''));

    if (!isNaN(cleanNumber)) {
      const converted = cleanNumber * rate;
      return `${match} (${CONVERTED_MARKER}${formatter.format(converted)})`;
    }
    return match;
  });
}

describe('replaceText (replaceTextInNode logic)', () => {
  it('converts a JPY price to EUR', () => {
    const result = replaceText('Price: ¥1,200', 'JPY', 0.006, 'EUR');
    expect(result).toContain('¥1,200');
    expect(result).toContain('€');
    expect(result).toContain(CONVERTED_MARKER);
  });

  it('does NOT double-convert already-converted text', () => {
    const first = replaceText('Price: ¥1,200', 'JPY', 0.006, 'EUR');
    const second = replaceText(first, 'JPY', 0.006, 'EUR');
    expect(second).toBe(first);
  });

  it('does NOT triple-convert (simulates repeated SPA re-renders)', () => {
    let text = 'Ticket: 13,870 JPY';
    for (let i = 0; i < 5; i++) {
      text = replaceText(text, 'JPY', 0.00534, 'EUR');
    }
    // Should contain exactly one conversion
    const conversionCount = (text.match(/\(/g) || []).length;
    expect(conversionCount).toBe(1);
  });

  it('converts multiple prices in a single text', () => {
    const result = replaceText('A: ¥500 and B: ¥1,000', 'JPY', 0.006, 'EUR');
    const conversionCount = (result.match(/\(/g) || []).length;
    expect(conversionCount).toBe(2);
  });

  it('leaves text without currency amounts unchanged', () => {
    const text = 'No prices here, just text.';
    expect(replaceText(text, 'JPY', 0.006, 'EUR')).toBe(text);
  });

  it('handles USD to EUR conversion', () => {
    const result = replaceText('Cost: $49.99', 'USD', 0.92, 'EUR');
    expect(result).toContain('$49.99');
    expect(result).toContain('€');
    const second = replaceText(result, 'USD', 0.92, 'EUR');
    expect(second).toBe(result);
  });
});

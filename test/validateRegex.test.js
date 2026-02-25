import { describe, it, expect } from 'vitest';

// Pure-function copy from options.js
const MAX_REGEX_LENGTH = 1000;
const REDOS_PATTERNS = [
  /\([^)]*[+*]\)[+*]/,
  /\(([^)]+)\|(\1)\)[+*]/,
  /\([^)]*\.\*[^)]*\)[+*]/,
  /\([^)]*\.\+[^)]*\)[+*]/,
];

function validateRegexSafety(pattern) {
  if (pattern.length > MAX_REGEX_LENGTH) {
    return `Pattern too long (${pattern.length} chars, max ${MAX_REGEX_LENGTH})`;
  }

  for (const dangerous of REDOS_PATTERNS) {
    if (dangerous.test(pattern)) {
      return 'Pattern contains nested quantifiers that may cause catastrophic backtracking';
    }
  }

  const testStrings = [
    '¥' + '1,234,567'.repeat(20),
    'a'.repeat(100) + '!',
    '$' + '0'.repeat(50) + '.' + '0'.repeat(50),
  ];

  try {
    const re = new RegExp(pattern, 'gi');
    const start = performance.now();
    for (const str of testStrings) {
      re.lastIndex = 0;
      str.replace(re, '');
    }
    const elapsed = performance.now() - start;
    if (elapsed > 200) {
      return `Pattern is too slow (${Math.round(elapsed)}ms on test input, max 200ms)`;
    }
  } catch (e) {
    return `Invalid regex: ${e.message}`;
  }

  return null;
}

describe('validateRegexSafety', () => {
  it('returns null for a valid pattern', () => {
    expect(validateRegexSafety('\\$[\\d,.]+')).toBe(null);
  });

  it('returns error for invalid syntax', () => {
    const result = validateRegexSafety('(unclosed');
    expect(result).toMatch(/Invalid regex/);
  });

  it('returns length error for patterns over 1000 chars', () => {
    const long = 'a'.repeat(1001);
    const result = validateRegexSafety(long);
    expect(result).toMatch(/too long/);
  });

  it('rejects nested quantifiers like (a+)+', () => {
    const result = validateRegexSafety('(a+)+');
    expect(result).toMatch(/nested quantifiers/);
  });

  it('rejects (.+)+', () => {
    const result = validateRegexSafety('(.+)+');
    expect(result).toMatch(/nested quantifiers/);
  });

  it('rejects (.*)*', () => {
    const result = validateRegexSafety('(.*)*');
    expect(result).toMatch(/nested quantifiers/);
  });

  it('passes normal currency-like patterns', () => {
    expect(validateRegexSafety('(?:€|EUR)\\s*([\\d,.]+)')).toBe(null);
    expect(validateRegexSafety('(?:\\$|US\\$|USD)\\s*([\\d,.]+)|([\\d,.]+)\\s*(?:\\$|US\\$|USD)')).toBe(null);
  });
});

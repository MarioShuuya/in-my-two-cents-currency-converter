const CURRENCIES = [
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'BRL', name: 'Brazilian Real' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', name: 'Chinese Yuan' },
  { code: 'CZK', name: 'Czech Koruna' },
  { code: 'DKK', name: 'Danish Krone' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'HKD', name: 'Hong Kong Dollar' },
  { code: 'HUF', name: 'Hungarian Forint' },
  { code: 'IDR', name: 'Indonesian Rupiah' },
  { code: 'ILS', name: 'Israeli New Sheqel' },
  { code: 'INR', name: 'Indian Rupee' },
  { code: 'ISK', name: 'Icelandic Króna' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'KRW', name: 'South Korean Won' },
  { code: 'MXN', name: 'Mexican Peso' },
  { code: 'MYR', name: 'Malaysian Ringgit' },
  { code: 'NOK', name: 'Norwegian Krone' },
  { code: 'NZD', name: 'New Zealand Dollar' },
  { code: 'PHP', name: 'Philippine Peso' },
  { code: 'PLN', name: 'Polish Złoty' },
  { code: 'RON', name: 'Romanian Leu' },
  { code: 'SEK', name: 'Swedish Krona' },
  { code: 'SGD', name: 'Singapore Dollar' },
  { code: 'THB', name: 'Thai Baht' },
  { code: 'TRY', name: 'Turkish Lira' },
  { code: 'USD', name: 'US Dollar' },
  { code: 'ZAR', name: 'South African Rand' },
];

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
  ZAR: { symbols: ['R', 'ZAR'] }
};

function getDefaultRegex(currency) {
  const patterns = CURRENCY_PATTERNS[currency];
  if (!patterns) return '';
  const group = patterns.symbols.join('|');
  return `(?:${group})\\s*([\\d,.]+)|([\\d,.]+)\\s*(?:${group})`;
}

const DEFAULT_SOURCE = 'JPY';
const DEFAULT_TARGET = 'EUR';

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

// ---------- Custom Dropdown Component ----------

const allSelects = [];

class CurrencySelect {
  constructor(container, hiddenInput, favorites, onChange) {
    this.container = container;
    this.hiddenInput = hiddenInput;
    this.favorites = favorites;
    this.onChange = onChange;
    this.open = false;
    this.value = hiddenInput.value || DEFAULT_SOURCE;

    this.trigger = document.createElement('button');
    this.trigger.type = 'button';
    this.trigger.className = 'cs-trigger';

    this.panel = document.createElement('div');
    this.panel.className = 'cs-panel';

    this.container.appendChild(this.trigger);
    this.container.appendChild(this.panel);

    this.trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggle();
    });

    allSelects.push(this);
    this.render();
  }

  setValue(code) {
    this.value = code;
    this.hiddenInput.value = code;
    this.updateTriggerLabel();
  }

  toggle() {
    this.open ? this.close() : this.openPanel();
  }

  openPanel() {
    for (const other of allSelects) {
      if (other !== this) other.close();
    }
    this.open = true;
    this.panel.classList.add('cs-open');
    this.trigger.classList.add('cs-active');
  }

  close() {
    this.open = false;
    this.panel.classList.remove('cs-open');
    this.trigger.classList.remove('cs-active');
  }

  updateTriggerLabel() {
    const cur = CURRENCIES.find(c => c.code === this.value);
    this.trigger.textContent = cur ? `${cur.code} - ${cur.name}` : this.value;
  }

  setFavorites(favorites) {
    this.favorites = favorites;
    this.render();
  }

  render() {
    this.panel.innerHTML = '';
    this.updateTriggerLabel();

    const favSet = new Set(this.favorites);
    const favItems = CURRENCIES.filter(c => favSet.has(c.code));
    const restItems = CURRENCIES.filter(c => !favSet.has(c.code));

    if (favItems.length > 0) {
      for (const cur of favItems) {
        this.panel.appendChild(this.createOption(cur, true));
      }
      const divider = document.createElement('div');
      divider.className = 'cs-divider';
      this.panel.appendChild(divider);
    }

    for (const cur of restItems) {
      this.panel.appendChild(this.createOption(cur, false));
    }
  }

  createOption(cur, isFav) {
    const row = document.createElement('div');
    row.className = 'cs-option';
    if (cur.code === this.value) row.classList.add('cs-selected');

    const star = document.createElement('span');
    star.className = 'cs-star';
    star.textContent = isFav ? '\u2605' : '\u2606';
    star.addEventListener('click', (e) => {
      e.stopPropagation();
      this.onStarClick(cur.code);
    });

    const label = document.createElement('span');
    label.className = 'cs-label';
    label.textContent = `${cur.code} - ${cur.name}`;

    row.appendChild(star);
    row.appendChild(label);

    row.addEventListener('click', () => {
      this.setValue(cur.code);
      this.render();
      this.close();
      if (this.onChange) this.onChange(cur.code);
    });

    return row;
  }

  onStarClick(code) {
    // Delegate to the global toggle handler
    toggleFavorite(code);
  }
}

// ---------- Favorites Management ----------

let favoriteCurrencies = [];
let sourceSelect = null;
let targetSelect = null;

function toggleFavorite(code) {
  const idx = favoriteCurrencies.indexOf(code);
  if (idx === -1) {
    favoriteCurrencies.push(code);
  } else {
    favoriteCurrencies.splice(idx, 1);
  }
  browser.storage.local.set({ favoriteCurrencies });
  if (sourceSelect) sourceSelect.setFavorites(favoriteCurrencies);
  if (targetSelect) targetSelect.setFavorites(favoriteCurrencies);
}

// ---------- Init ----------

document.addEventListener('DOMContentLoaded', () => {
  const sourceContainer = document.querySelector('[data-id="source-currency"]');
  const targetContainer = document.querySelector('[data-id="target-currency"]');
  const sourceInput = document.getElementById('source-currency');
  const targetInput = document.getElementById('target-currency');
  const regexEl = document.getElementById('custom-regex');
  const regexError = document.getElementById('regex-error');
  const statusEl = document.getElementById('status');

  let userHasCustomRegex = false;

  browser.storage.local.get(['sourceCurrency', 'targetCurrency', 'customRegex', 'favoriteCurrencies']).then((data) => {
    favoriteCurrencies = data.favoriteCurrencies || [];

    sourceInput.value = data.sourceCurrency || DEFAULT_SOURCE;
    targetInput.value = data.targetCurrency || DEFAULT_TARGET;

    sourceSelect = new CurrencySelect(sourceContainer, sourceInput, favoriteCurrencies, (code) => {
      if (!userHasCustomRegex) {
        regexEl.value = getDefaultRegex(code);
      }
    });

    targetSelect = new CurrencySelect(targetContainer, targetInput, favoriteCurrencies, null);

    if (data.customRegex) {
      regexEl.value = data.customRegex;
      userHasCustomRegex = true;
    } else {
      regexEl.value = getDefaultRegex(sourceInput.value);
    }
  });

  // Close dropdowns on outside click
  document.addEventListener('click', () => {
    if (sourceSelect) sourceSelect.close();
    if (targetSelect) targetSelect.close();
  });

  // Close dropdowns on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (sourceSelect) sourceSelect.close();
      if (targetSelect) targetSelect.close();
    }
  });

  regexEl.addEventListener('input', () => {
    userHasCustomRegex = true;
    regexError.textContent = '';
  });

  document.getElementById('reset-regex').addEventListener('click', () => {
    userHasCustomRegex = false;
    regexEl.value = getDefaultRegex(sourceInput.value);
    regexError.textContent = '';
    browser.storage.local.remove('customRegex');
  });

  document.getElementById('save').addEventListener('click', () => {
    const source = sourceInput.value;
    const target = targetInput.value;
    const regexValue = regexEl.value.trim();

    if (source === target) {
      statusEl.textContent = 'Source and target must be different';
      statusEl.style.color = '#c62828';
      setTimeout(() => {
        statusEl.textContent = '';
        statusEl.style.color = '';
      }, 3000);
      return;
    }

    if (userHasCustomRegex && regexValue) {
      const safetyError = validateRegexSafety(regexValue);
      if (safetyError) {
        regexError.textContent = safetyError;
        return;
      }
    }

    regexError.textContent = '';

    const toSave = {
      sourceCurrency: source,
      targetCurrency: target,
      rate: null,
      timestamp: null
    };

    if (userHasCustomRegex && regexValue && regexValue !== getDefaultRegex(source)) {
      toSave.customRegex = regexValue;
    } else {
      toSave.customRegex = null;
    }

    browser.storage.local.set(toSave).then(() => {
      statusEl.textContent = 'Saved!';
      setTimeout(() => {
        statusEl.textContent = '';
      }, 1500);
    });
  });
});

const CURRENCIES = [
  'AUD', 'BRL', 'CAD', 'CHF', 'CNY', 'CZK', 'DKK', 'EUR', 'GBP', 'HKD',
  'HUF', 'IDR', 'ILS', 'INR', 'ISK', 'JPY', 'KRW', 'MXN', 'MYR', 'NOK',
  'NZD', 'PHP', 'PLN', 'RON', 'SEK', 'SGD', 'THB', 'TRY', 'USD', 'ZAR'
];

let currentRate = 0;
let numberFormat = 'auto';

function detectPopupFormat() {
  const formatted = new Intl.NumberFormat(navigator.language || 'en').format(1.1);
  return formatted.includes(',') ? 'comma' : 'period';
}

function parseNumber(str, format) {
  const effective = format === 'auto' ? detectPopupFormat() : format;
  if (effective === 'comma') {
    return parseFloat(str.replace(/\./g, '').replace(',', '.'));
  }
  return parseFloat(str.replace(/,/g, ''));
}

document.addEventListener('DOMContentLoaded', () => {
  const sourceEl = document.getElementById('source-currency');
  const targetEl = document.getElementById('target-currency');
  const amountEl = document.getElementById('amount');
  const resultEl = document.getElementById('result');
  const rateEl = document.getElementById('current-rate');
  const swapBtn = document.getElementById('swap');

  // Populate dropdowns
  for (const code of CURRENCIES) {
    sourceEl.appendChild(new Option(code, code));
    targetEl.appendChild(new Option(code, code));
  }

  const formatEl = document.getElementById('number-format');

  // Load saved currencies and number format, then fetch rate
  browser.storage.local.get(['sourceCurrency', 'targetCurrency', 'numberFormat']).then((data) => {
    sourceEl.value = data.sourceCurrency || 'JPY';
    targetEl.value = data.targetCurrency || 'EUR';
    numberFormat = data.numberFormat || 'auto';
    formatEl.value = numberFormat;
    fetchRate();
  });

  formatEl.addEventListener('change', () => {
    numberFormat = formatEl.value;
    browser.storage.local.set({ numberFormat });
    convert();
  });

  function fetchRate() {
    const source = sourceEl.value;
    const target = targetEl.value;
    rateEl.textContent = 'loading...';
    browser.runtime.sendMessage({ action: 'getRate', source, target }).then((data) => {
      if (data && data.rate) {
        currentRate = data.rate;
        rateEl.textContent = currentRate.toFixed(6);
        convert();
      } else {
        rateEl.textContent = 'unavailable';
      }
    });
  }

  function convert() {
    const num = parseNumber(amountEl.value, numberFormat);
    if (!isNaN(num) && currentRate) {
      const converted = num * currentRate;
      resultEl.textContent = formatResult(converted, targetEl.value);
    } else {
      resultEl.textContent = '0';
    }
  }

  function formatResult(value, currency) {
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency,
        maximumFractionDigits: 2
      }).format(value);
    } catch {
      return value.toFixed(2);
    }
  }

  // Live conversion on typing
  amountEl.addEventListener('input', convert);

  // Currency change -> save and re-fetch rate
  function onCurrencyChange() {
    currentRate = 0;
    resultEl.textContent = '0';
    browser.storage.local.set({
      sourceCurrency: sourceEl.value,
      targetCurrency: targetEl.value
    });
    fetchRate();
  }

  sourceEl.addEventListener('change', onCurrencyChange);
  targetEl.addEventListener('change', onCurrencyChange);

  // Swap button
  swapBtn.addEventListener('click', () => {
    const tmp = sourceEl.value;
    sourceEl.value = targetEl.value;
    targetEl.value = tmp;
    onCurrencyChange();
  });

  document.getElementById('open-options').addEventListener('click', () => {
    browser.runtime.openOptionsPage();
  });
});

const API_BASE = 'https://api.frankfurter.app/latest';
const CACHE_MINUTES = 60;
const DEFAULT_SOURCE = 'JPY';
const DEFAULT_TARGET = 'EUR';

async function getCurrencyPair() {
  const data = await browser.storage.local.get(['sourceCurrency', 'targetCurrency']);
  return {
    source: data.sourceCurrency || DEFAULT_SOURCE,
    target: data.targetCurrency || DEFAULT_TARGET
  };
}

async function getExchangeRate() {
  const { source, target } = await getCurrencyPair();
  const data = await browser.storage.local.get(['rate', 'timestamp', 'cachedSource', 'cachedTarget']);
  const now = Date.now();

  // Use cached rate if fresh and for the same currency pair
  if (
    data.rate && data.timestamp &&
    data.cachedSource === source && data.cachedTarget === target &&
    (now - data.timestamp < CACHE_MINUTES * 60 * 1000)
  ) {
    return { rate: data.rate, source, target };
  }

  try {
    const url = `${API_BASE}?from=${source}&to=${target}`;
    const response = await fetch(url);
    const apiData = await response.json();
    const rate = apiData.rates[target];
    await browser.storage.local.set({
      rate,
      timestamp: now,
      cachedSource: source,
      cachedTarget: target
    });
    return { rate, source, target };
  } catch {
    // Offline fallback: return stale cache if available
    return { rate: data.rate || 0, source, target };
  }
}

// Listen for the content script asking for the rate
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getRate') {
    getExchangeRate().then(sendResponse);
    return true;
  }
});

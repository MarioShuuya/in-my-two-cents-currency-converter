let currentRate = 0;
let sourceCurrency = 'JPY';
let targetCurrency = 'EUR';
let regex = null;
let formatter = null;

// Currency symbols and keywords used to detect amounts in page text
const CURRENCY_PATTERNS = {
  AUD: { symbols: ['A\\$', 'AU\\$', 'AUD'], locale: 'en-AU' },
  BRL: { symbols: ['R\\$', 'BRL'], locale: 'pt-BR' },
  CAD: { symbols: ['C\\$', 'CA\\$', 'CAD'], locale: 'en-CA' },
  CHF: { symbols: ['CHF', 'Fr\\.'], locale: 'de-CH' },
  CNY: { symbols: ['¥', 'CN¥', 'CNY', 'RMB'], locale: 'zh-CN' },
  CZK: { symbols: ['Kč', 'CZK'], locale: 'cs-CZ' },
  DKK: { symbols: ['kr\\.?', 'DKK'], locale: 'da-DK' },
  EUR: { symbols: ['€', 'EUR'], locale: 'de-DE' },
  GBP: { symbols: ['£', 'GBP'], locale: 'en-GB' },
  HKD: { symbols: ['HK\\$', 'HKD'], locale: 'zh-HK' },
  HUF: { symbols: ['Ft', 'HUF'], locale: 'hu-HU' },
  IDR: { symbols: ['Rp\\.?', 'IDR'], locale: 'id-ID' },
  ILS: { symbols: ['₪', 'NIS', 'ILS'], locale: 'he-IL' },
  INR: { symbols: ['₹', 'Rs\\.?', 'INR'], locale: 'en-IN' },
  ISK: { symbols: ['kr\\.?', 'ISK'], locale: 'is-IS' },
  JPY: { symbols: ['¥', 'Yen', 'JPY'], locale: 'ja-JP' },
  KRW: { symbols: ['₩', 'KRW'], locale: 'ko-KR' },
  MXN: { symbols: ['MX\\$', 'MXN'], locale: 'es-MX' },
  MYR: { symbols: ['RM', 'MYR'], locale: 'ms-MY' },
  NOK: { symbols: ['kr\\.?', 'NOK'], locale: 'nb-NO' },
  NZD: { symbols: ['NZ\\$', 'NZD'], locale: 'en-NZ' },
  PHP: { symbols: ['₱', 'PHP'], locale: 'en-PH' },
  PLN: { symbols: ['zł', 'PLN'], locale: 'pl-PL' },
  RON: { symbols: ['lei', 'RON'], locale: 'ro-RO' },
  SEK: { symbols: ['kr\\.?', 'SEK'], locale: 'sv-SE' },
  SGD: { symbols: ['S\\$', 'SG\\$', 'SGD'], locale: 'en-SG' },
  THB: { symbols: ['฿', 'THB'], locale: 'th-TH' },
  TRY: { symbols: ['₺', 'TL', 'TRY'], locale: 'tr-TR' },
  USD: { symbols: ['\\$', 'US\\$', 'USD'], locale: 'en-US' },
  ZAR: { symbols: ['R', 'ZAR'], locale: 'en-ZA' }
};

function buildRegex(currency) {
  const patterns = CURRENCY_PATTERNS[currency];
  if (!patterns) return null;
  const group = patterns.symbols.join('|');
  // Match currency symbol/code before or after a number
  return new RegExp(
    `(?:${group})\\s*([\\d,.]+)|([\\d,.]+)\\s*(?:${group})`,
    'gi'
  );
}

function buildFormatter(currency) {
  const patterns = CURRENCY_PATTERNS[currency];
  const locale = patterns ? patterns.locale : 'en-US';
  return new Intl.NumberFormat(locale, { style: 'currency', currency });
}

// Fetch the exchange rate and currency pair from the background script
browser.runtime.sendMessage({ action: 'getRate' }).then(async (data) => {
  if (!data || !data.rate) return;

  currentRate = data.rate;
  sourceCurrency = data.source;
  targetCurrency = data.target;
  formatter = buildFormatter(targetCurrency);

  // Use custom regex if set, otherwise fall back to default
  const stored = await browser.storage.local.get('customRegex');
  if (stored.customRegex) {
    try {
      regex = new RegExp(stored.customRegex, 'gi');
    } catch (e) {
      regex = buildRegex(sourceCurrency);
    }
  } else {
    regex = buildRegex(sourceCurrency);
  }

  if (!regex) return;

  processNode(document.body);

  // Watch for dynamically loaded content
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          processNode(node);
        } else if (node.nodeType === Node.TEXT_NODE) {
          replaceTextInNode(node);
        }
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
});

function processNode(rootNode) {
  const walker = document.createTreeWalker(
    rootNode,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        const parentName = node.parentNode ? node.parentNode.nodeName.toLowerCase() : '';
        if (['script', 'style', 'noscript', 'textarea'].includes(parentName)) {
          return NodeFilter.FILTER_REJECT;
        }
        regex.lastIndex = 0;
        return regex.test(node.nodeValue)
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_SKIP;
      }
    }
  );

  const nodesToReplace = [];
  let currentNode;
  while ((currentNode = walker.nextNode())) {
    nodesToReplace.push(currentNode);
  }

  nodesToReplace.forEach(replaceTextInNode);
}

const MAX_MATCHES_PER_NODE = 50;
const MAX_MATCH_LENGTH = 100;

function replaceTextInNode(node) {
  regex.lastIndex = 0;
  let matchCount = 0;
  node.nodeValue = node.nodeValue.replace(regex, (match, p1, p2) => {
    if (++matchCount > MAX_MATCHES_PER_NODE) return match;
    if (match.length > MAX_MATCH_LENGTH) return match;

    const numberString = p1 || p2;
    if (!numberString) return match;
    const cleanNumber = parseFloat(numberString.replace(/,/g, ''));

    if (!isNaN(cleanNumber)) {
      const converted = cleanNumber * currentRate;
      return `${match} (${formatter.format(converted)})`;
    }
    return match;
  });
}

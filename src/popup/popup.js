document.addEventListener('DOMContentLoaded', () => {
  // Load current rate and currency pair from background
  browser.runtime.sendMessage({ action: "getRate" }).then((data) => {
    if (data && data.rate) {
      document.getElementById('current-rate').textContent = data.rate.toFixed(6);
      document.getElementById('source-currency').textContent = data.source;
      document.getElementById('target-currency').textContent = data.target;
    }
  });

  document.getElementById('open-options').addEventListener('click', () => {
    browser.runtime.openOptionsPage();
  });
});

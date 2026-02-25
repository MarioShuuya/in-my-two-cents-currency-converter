# In My Two Cents - Currency Converter

<p align="center">
  <img src="icons/icon.svg" alt="In My Two Cents icon" width="96">
</p>

A Firefox WebExtension that automatically detects currency amounts on web pages and converts them inline to your preferred currency.

## Features

- Scans page text for currency symbols and codes (e.g. ¥1,000 or 1000 JPY)
- Appends converted amount inline: `¥1,000 (5,45 €)`
- Live exchange rates via [Frankfurter API](https://www.frankfurter.app/) with 60-minute caching
- Handles dynamically loaded content via MutationObserver
- Popup showing current rate at a glance
- Options page to configure source and target currencies
- Favorite currencies — star the ones you use most and they pin to the top of each dropdown
- Custom regex override for advanced currency detection
- 30 supported currencies

## Project Structure

```
├── manifest.json
├── icons/
│   ├── icon.svg           # Source icon
│   ├── icon-48.png
│   └── icon-96.png
├── src/
│   ├── background/
│   │   └── background.js    # Exchange rate fetching & caching
│   ├── content/
│   │   └── content.js       # DOM scanning & inline conversion
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.css
│   │   └── popup.js         # Quick rate display
│   └── options/
│       ├── options.html
│       ├── options.css
│       └── options.js       # Currency pair settings & favorites
├── test/
│   ├── buildRegex.test.js
│   ├── validateRegex.test.js
│   └── getDefaultRegex.test.js
├── package.json
├── LICENSE
└── README.md
```

## Installation

### Firefox — Temporary Install (for testing)

1. Clone or download this repository
2. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
3. Click **Load Temporary Add-on…**
4. Browse to the project folder and select `manifest.json`

> The extension stays active until you close Firefox. You'll need to re-load it each session.

### Firefox — Permanent Local Install (unsigned)

By default Firefox only allows signed add-ons. To install locally without signing:

1. Open Firefox and go to `about:config`
2. Search for `xpinstall.signatures.required` and set it to `false`
   *(This setting is only available in Firefox Developer Edition, Nightly, and ESR — it cannot be changed in regular Firefox)*
3. Package the extension into a `.zip`:
   ```sh
   # From the project root
   zip -r in-my-two-cents.xpi manifest.json icons/ src/
   ```
   Or on Windows (PowerShell):
   ```powershell
   Compress-Archive -Path manifest.json, icons, src -DestinationPath in-my-two-cents.xpi
   ```
4. Open `about:addons` in Firefox
5. Click the gear icon → **Install Add-on From File…**
6. Select the `.xpi` file

### Firefox — Using web-ext (recommended for development)

[web-ext](https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/) auto-reloads on file changes:

```sh
npm install -g web-ext   # one-time setup
web-ext run               # launches Firefox with the extension loaded
```

## Development

### Reload after changes

If using `about:debugging`, click **Reload** next to the extension.
If using `web-ext run`, changes reload automatically.

### Running tests

```sh
npm install
npm test
```

## License

[MIT](LICENSE)

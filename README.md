# Zapdial

**Zapdial** is a fast, lightweight new-tab speed dial for Manifest V3 browsers.
It turns a bookmark folder named **Speed Dial** into a clean 3-column grid of
tiles — each showing only a site's favicon and title — with full support for
nested folders and instant, in-memory folder navigation.

Built as a small showcase of modern extension development:

- **Zero dependencies at runtime** — no frameworks, vanilla TypeScript.
- **Fast by design** — the bookmark subtree is indexed once in memory, so opening
  a folder is a synchronous lookup and a single DOM fragment render (one layout pass,
  no round-trip to `chrome.bookmarks`).
- **Instant first paint** — a `storage.session` snapshot draws the grid on the very
  first frame, before the live bookmark data is reconciled.
- **Lightweight web components** — `<dial-grid>` and `<dial-item>` handle folder
  clicks via a bubbling `dial-navigate` event, using light DOM (no per-tile Shadow Roots).
- **Live sync** — bookmark changes are picked up automatically (debounced) while the
  tab is open.

If the folder doesn't exist yet, Zapdial creates it on first install — drop your favorite sites into it, and you're done.

## 🔐 Permissions

- `favicon` permission enables `chrome-extension://_favicon/…` from the new tab page (Chrome ≥ 104).
- `bookmarks` is required to read the **Speed Dial** folder (and its nested subfolders) via the Bookmarks API, watch for live changes while a tab is open, and create the folder automatically on first install.
- `https://icons.duckduckgo.com/*` — a favicon fallback for Firefox. Since Firefox doesn't yet support the `_favicon` API, tiles there fetch favicons from DuckDuckGo's icon service (`https://icons.duckduckgo.com/ip3/<domain>/ico`) keyed by site domain instead; on Chromium builds this host permission simply goes unused.
- `storage` is used only for a tiny `storage.session` snapshot so the page can paint before the async `chrome.bookmarks` read resolves.

## 🚀 Installation

### Load unpacked (development)

```bash
# Chromium
# chrome://extensions → enable Developer mode → "Load unpacked" → select the project folder

# Firefox
# about:debugging#/runtime/this-firefox → "Load Temporary Add-on…" → select manifest.json
```

## 🧩 Browser compatibility

| Browser|
|------------------------|
| Chrome/Chromium ≥ 146|
| Firefox ≥ 153|

Firefox-specific manifest keys live under `browser_specific_settings.gecko` (add-on id, strict min version, data-collection declaration) and are ignored by Chromium.

## 🎨 Credits

- Project logo generated with [Lumo](https://lumo.proton.me) (Proton).
- Created by Zatsune Sakurako.

## 📜 License

Copyright © 2026 Zatsune Sakurako.

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3 of the License.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

Full text: [LICENSE](./LICENSE) · [gnu.org/licenses/gpl-3.0](https://www.gnu.org/licenses/gpl-3.0.html) · SPDX: `GPL-3.0-or-later`

# GitHub Project Filter Enhancer (WXT-based)

Rebuilt with WXT for maintainability and modularity. Adds a fuzzy-search button and a saved-filters toolbar on GitHub Projects pages.

## Features
- One-click fuzzy search: convert current query to `title:*keyword*`
- Saved filters: star to save, dropdown to apply, manage/delete

## Getting Started (WXT)
1. Install deps: `npm i`
2. Dev mode: `npm run dev` (follow WXT prompt to load the extension)
3. Build/Zip: `npm run build`, `npm run zip`

## Structure
- Entrypoint: `entrypoints/content.ts`
- Modules: `modules/` (`filter.ts`, `storage.ts`, `ui.ts`)
- Config: `wxt.config.ts`, `tsconfig.json`

## Docs
- Features: `docs/FEATURES-zh.md`
- Development & Publishing: `docs/DEVELOPMENT-zh.md`
- Store Listing (CN): `STORE-LISTING-zh.md`
- Privacy Policy (CN): `PRIVACY-POLICY-zh.md`

## Compatibility & Notes
- Chromium browsers (MV3)
- Runs on `github.com` Projects pages
- Legacy `extension/` directory is deprecated (kept for reference)
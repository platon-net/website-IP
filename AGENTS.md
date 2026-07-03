# Repository Guidelines

## Project Structure & Module Organization

WebsiteIP is a Manifest V3 browser extension. `manifest.json` defines permissions, entry points, and the release version. Core behavior lives in top-level JavaScript files: `background.js` resolves IP and country data, `ip.js` injects the page badge, and `popup.js`, `options.js`, and `i18n.js` support their matching HTML views. Styles are under `css/`; icons, country flags, and other UI assets are under `images/`. Locale strings live in `_locales/en/` and `_locales/sk/`. `MaxMind/GeoLite2-Country.mmdb` supplies offline country lookup. Treat `build/` as packaged release output. The ignored `test/` directory contains experiments, not the maintained test suite.

## Build, Test, and Development Commands

- `npm install` installs `libmaxmind`, which `background.js` imports directly from `node_modules`.
- `build-addon.bat` creates `build/firefox/WebsiteIP.<version>.xpi` using the version in `manifest.json`. Run it from Windows Command Prompt; Chrome packaging is currently disabled.
- `node --check background.js` (repeat for changed `.js` files) performs a quick syntax check.

For local development, open Firefox's `about:debugging`, choose **This Firefox**, then **Load Temporary Add-on** and select `manifest.json`. Reload the temporary extension after changes.

## Coding Style & Naming Conventions

Use plain JavaScript, HTML, and CSS without introducing a framework. Match nearby formatting: tabs are prevalent, semicolons are required, and strings generally use single quotes. Use `camelCase` for functions and local variables, descriptive message names such as `getIPbyURL`, and kebab-case for HTML IDs and CSS classes. Keep browser-facing text in `_locales/*/messages.json`; update both supported locales together. Avoid unrelated reformatting in focused changes.

## Testing Guidelines

There is no automated test runner or coverage threshold. Syntax-check changed scripts, then test manually in Firefox. Verify the badge, popup, enable/disable state, clipboard action, options persistence, IPv4/IPv6 lookup, country flag, and behavior across tab navigation. Test permission or manifest changes on both HTTP and HTTPS pages. Do not treat the placeholder `npm test` commands under `test/` as validation.

## Commit & Pull Request Guidelines

Recent history uses short, lowercase, action-oriented subjects such as `fixed checkBox...`, often ending with `release 1.2.19`. Keep commits narrowly scoped and mention the release version only when updating packaged artifacts. Pull requests should explain user-visible behavior, list manual test cases and Firefox version, link relevant issues, and include screenshots for popup, options, or injected-badge changes. Call out permission, locale, MaxMind database, and generated `build/` changes explicitly.

# YouTube Shorts Remover (Tampermonkey)

A Tampermonkey userscript that removes YouTube Shorts from YouTube pages, including:

- Home page
- Subscription feed
- Other feeds
- Watch page recommendations
- Channel pages
- Search results
- Sidebar

It can also:

- Redirect you away from `/shorts/...`
- Block Shorts page scrolling
- Open a built-in settings panel
- Run cleanup manually from the Tampermonkey menu

## Features

- Removes known Shorts components and shelves
- Supports newer Shorts elements such as:
  - `ytm-shorts-lockup-view-model`
  - `ytm-shorts-lockup-view-model-v2`
- Detects YouTube SPA navigation more reliably
- Uses targeted mutation handling instead of broad repeated full-page scans
- Uses centralized Shorts matching logic for easier maintenance
- Includes optional debug mode
- Includes configurable console color
- Includes a floating settings panel
- Includes Tampermonkey menu commands

## Requirements

- [Tampermonkey](https://www.tampermonkey.net/)
- A supported browser such as Chrome, Edge, Firefox, or Brave

## Installation

### Option 1 - Manual install

1. Open Tampermonkey
2. Create a new script
3. Replace the default content with the contents of `youtube-shorts-remover.user.js`
4. Save the script

### Option 2 - Install from GitHub

After uploading this repo to GitHub, use the **raw** file URL of:

`youtube-shorts-remover.user.js`

Example raw URL pattern:

`https://raw.githubusercontent.com/YOUR_USERNAME/youtube-shorts-remover-tampermonkey/main/youtube-shorts-remover.user.js`

Then add that raw URL into the userscript metadata as:

- `@updateURL`
- `@downloadURL`

## How to use

### Open settings

You can open the settings panel from the Tampermonkey userscript menu.

Available settings:

- Remove from Start Page
- Remove from Subscription Feed
- Remove from All Feeds
- Remove from Watch Page
- Remove from Channel Page
- Remove from Search
- Remove Sidebar Shorts
- Disable Shorts Page
- Disable Shorts Scrolling
- Debug Mode
- Console Color

### Run cleanup manually

You can also run Shorts cleanup manually from the Tampermonkey userscript menu.

## How it works

The script:

- Hides and removes known Shorts-related components
- Detects links pointing to `/shorts/`
- Removes matching cards, rows, and shelves
- Reacts to YouTube page changes without relying only on full page reloads
- Watches for newly added Shorts content and removes it dynamically

## Notes

- YouTube changes its DOM often, so selectors may need updates over time
- This script does not collect data or send network requests
- Auto-update is disabled until you add your own `@updateURL` and `@downloadURL`
- Some future YouTube UI changes may require selector updates

## Development notes

Current script version:
- `2.0.0`

Current Tampermonkey grants:
- `GM_setValue`
- `GM_getValue`
- `GM_registerMenuCommand`

## License

MIT

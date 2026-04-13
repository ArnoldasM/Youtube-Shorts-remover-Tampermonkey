# YouTube Shorts Remover (Tampermonkey)

A Tampermonkey userscript that removes YouTube Shorts from:

- Home page
- Subscription feed
- Other feeds
- Watch page recommendations
- Channel pages
- Search results
- Sidebar
- Shorts pages themselves (optional redirect)

It also adds a small configuration menu on:

`https://www.youtube.com/account_playback`

## Features

- Removes Shorts-related shelves and cards
- Supports newer Shorts elements such as:
  - `ytm-shorts-lockup-view-model`
  - `ytm-shorts-lockup-view-model-v2`
- Optional redirect away from `/shorts/...`
- Optional blocking of Shorts page scrolling
- Configurable via Tampermonkey storage

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

Then put that raw URL into the script metadata as `@updateURL` and `@downloadURL`.

## Configuration

Open:

`https://www.youtube.com/account_playback`

The script adds a small settings panel there.

## Notes

- YouTube changes its DOM often, so selectors may need updates over time.
- This script does not collect data or send network requests.
- Auto-update is disabled by default in this repo version.

## License

MIT
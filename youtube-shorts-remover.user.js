// ==UserScript==
// @name         YouTube Shorts Remover
// @namespace    http://tampermonkey.net/
// @version      2.0.1
// @description  Removes YouTube Shorts from home, feeds, watch page, channels, search, and sidebar. Includes settings panel.
// @author       Arnoldas M.
// @license      MIT
// @updateURL    https://raw.githubusercontent.com/ArnoldasM/youtube-shorts-remover-tampermonkey/main/youtube-shorts-remover.user.js
// @downloadURL  https://raw.githubusercontent.com/ArnoldasM/youtube-shorts-remover-tampermonkey/main/youtube-shorts-remover.user.js
// @match        https://www.youtube.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function () {
	'use strict';

	const CONFIG_DEFAULTS = {
		removeFromStartPage: true,
		removeFromSubscriptionFeed: true,
		removeFromAllFeeds: true,
		removeFromFollowUp: true,
		removeFromChannel: true,
		removeSidebar: true,
		disableShortPage: true,
		removeFromSearch: true,
		disableShortPageScrolling: true,
		debugMode: false,
		consoleColor: '#33bd52'
	};

	const SELECTORS = {
		shortNodes: [
			'[is-shorts]',
			'[is-reel-item-style-avatar-circle]',
			'ytd-reel-item-renderer',
			'ytd-reel-shelf-renderer',
			'grid-shelf-view-model',
			'ytm-shorts-lockup-view-model',
			'ytm-shorts-lockup-view-model-v2'
		],
		shortContainers: [
			'ytd-video-renderer',
			'ytd-grid-video-renderer',
			'ytd-rich-item-renderer',
			'ytd-compact-video-renderer',
			'ytd-rich-grid-media',
			'ytm-shorts-lockup-view-model',
			'ytm-shorts-lockup-view-model-v2',
			'#items > *',
			'yt-horizontal-list-renderer > #items > *'
		],
		shelfContainers: [
			'yt-horizontal-list-renderer',
			'#scroll-outer-container',
			'#scroll-container',
			'#items',
			'ytd-rich-shelf-renderer',
			'ytd-shelf-renderer',
			'ytd-item-section-renderer',
			'ytd-rich-section-renderer'
		],
		sidebarShorts: [
			'.yt-simple-endpoint[title="Shorts"]',
			'a[title="Shorts"]'
		],
		channelShortsTabs: [
			'[tab-title="Shorts"]',
			'a[title="Shorts"]',
			'a[href$="/shorts"]'
		],
		shortLinks: 'a[href^="/shorts/"], a[href*="/shorts/"]',
		watchLinks: 'a[href^="/watch"], a[href*="/watch?"]'
	};

	const config = loadConfig();
	let observer = null;
	let scheduled = false;
	let settingsPanel = null;
	let lastUrl = location.href;

	function loadConfig() {
		return {
			removeFromStartPage: GM_getValue('removeFromStartPage', CONFIG_DEFAULTS.removeFromStartPage),
			removeFromSubscriptionFeed: GM_getValue('removeFromSubscriptionFeed', CONFIG_DEFAULTS.removeFromSubscriptionFeed),
			removeFromAllFeeds: GM_getValue('removeFromAllFeeds', CONFIG_DEFAULTS.removeFromAllFeeds),
			removeFromFollowUp: GM_getValue('removeFromFollowUp', CONFIG_DEFAULTS.removeFromFollowUp),
			removeFromChannel: GM_getValue('removeFromChannel', CONFIG_DEFAULTS.removeFromChannel),
			removeSidebar: GM_getValue('removeSidebar', CONFIG_DEFAULTS.removeSidebar),
			disableShortPage: GM_getValue('disableShortPage', CONFIG_DEFAULTS.disableShortPage),
			removeFromSearch: GM_getValue('removeFromSearch', CONFIG_DEFAULTS.removeFromSearch),
			disableShortPageScrolling: GM_getValue('disableShortPageScrolling', CONFIG_DEFAULTS.disableShortPageScrolling),
			debugMode: GM_getValue('debugMode', CONFIG_DEFAULTS.debugMode),
			consoleColor: GM_getValue('consoleColor', CONFIG_DEFAULTS.consoleColor)
		};
	}

	function saveConfig(key, value) {
		config[key] = value;
		GM_setValue(key, value);
	}

	function log(...args) {
		if (!config.debugMode) return;
		const message = args.map(arg => String(arg)).join(' ');
		console.log('%c[ShortsRemover] ' + message, 'color: ' + config.consoleColor);
	}

	function info(...args) {
		const message = args.map(arg => String(arg)).join(' ');
		console.log('%c[ShortsRemover] ' + message, 'color: ' + config.consoleColor);
	}

	function safeRemove(element) {
		if (element && element.parentNode) {
			element.parentNode.removeChild(element);
		}
	}

	function safeHide(element) {
		if (element && element.style) {
			element.style.setProperty('display', 'none', 'important');
		}
	}

	function matchesAny(element, selectors) {
		return selectors.some(selector => {
			try {
				return element.matches && element.matches(selector);
			} catch {
				return false;
			}
		});
	}

	function hasShortLink(element) {
		return !!(element && element.querySelector && element.querySelector(SELECTORS.shortLinks));
	}

	function hasWatchLink(element) {
		return !!(element && element.querySelector && element.querySelector(SELECTORS.watchLinks));
	}

	function isKnownShortNode(element) {
		return !!(element && matchesAny(element, SELECTORS.shortNodes));
	}

	function isKnownShortContainer(element) {
		return !!(element && matchesAny(element, SELECTORS.shortContainers));
	}

	function shouldRemoveForCurrentPage() {
		const url = location.href;

		if (isShortsPage(url)) return config.disableShortPage;
		if (isHomePage(url)) return config.removeFromStartPage;
		if (isSubscriptionsPage(url)) return config.removeFromSubscriptionFeed;
		if (isFeedPage(url)) return config.removeFromAllFeeds;
		if (isWatchPage(url)) return config.removeFromFollowUp;
		if (isChannelPage(url)) return config.removeFromChannel;
		if (isSearchPage(url)) return config.removeFromSearch;

		return true;
	}

	function isHomePage(url) {
		return /^https?:\/\/(www\.)?youtube\.com\/?$/.test(url);
	}

	function isFeedPage(url) {
		return /^https?:\/\/(www\.)?youtube\.com\/((feed)|(gaming))(?!\/subscriptions.*).*$/i.test(url);
	}

	function isSubscriptionsPage(url) {
		return /^https?:\/\/(www\.)?youtube\.com\/feed\/subscriptions\/?$/i.test(url);
	}

	function isWatchPage(url) {
		return /^https?:\/\/(www\.)?youtube\.com\/watch\/?.*$/i.test(url);
	}

	function isShortsPage(url) {
		return /^https?:\/\/(www\.)?youtube\.com\/shorts.*$/i.test(url);
	}

	function isSearchPage(url) {
		return /^https?:\/\/(www\.)?youtube\.com\/results.*$/i.test(url);
	}

	function isChannelPage(url) {
		return /^https?:\/\/(www\.)?youtube\.com\/(?!feed.*)(?!watch.*)(?!short.*)(?!playlist.*)(?!podcasts.*)(?!gaming.*)(?!results.*).+$/i.test(url);
	}

	function injectCss() {
		if (document.getElementById('yt-shorts-remover-style')) return;

		const style = document.createElement('style');
		style.id = 'yt-shorts-remover-style';
		style.textContent = `
			ytm-shorts-lockup-view-model,
			ytm-shorts-lockup-view-model-v2,
			ytd-reel-item-renderer,
			ytd-reel-shelf-renderer {
				display: none !important;
			}

			.yt-shorts-remover-hidden {
				display: none !important;
			}

			#yt-shorts-remover-panel {
				position: fixed;
				top: 20px;
				right: 20px;
				width: 360px;
				max-width: calc(100vw - 40px);
				background: #0f0f0f;
				color: #fff;
				border: 1px solid #3f3f3f;
				border-radius: 12px;
				padding: 16px;
				z-index: 999999;
				box-shadow: 0 8px 30px rgba(0,0,0,.45);
				font-family: Arial, sans-serif;
			}

			#yt-shorts-remover-panel h2 {
				margin: 0 0 12px 0;
				font-size: 18px;
			}

			#yt-shorts-remover-panel .row {
				display: flex;
				justify-content: space-between;
				align-items: center;
				gap: 12px;
				margin: 8px 0;
			}

			#yt-shorts-remover-panel .footer {
				display: flex;
				justify-content: flex-end;
				gap: 8px;
				margin-top: 14px;
			}

			#yt-shorts-remover-panel button {
				background: #272727;
				color: #fff;
				border: 1px solid #4a4a4a;
				border-radius: 8px;
				padding: 8px 12px;
				cursor: pointer;
			}
		`;
		(document.head || document.documentElement).appendChild(style);
	}

	function removeSidebarShorts() {
        if (!config.removeSidebar) return;

        document.querySelectorAll('ytd-guide-entry-renderer, ytd-mini-guide-entry-renderer').forEach(entry => {
            const text = entry.textContent?.trim().toLowerCase() || '';
            const link = entry.querySelector('a[href="/shorts"], a[href^="/shorts"]');

            if (text === 'shorts' || link) {
                safeHide(entry);
            }
        });
    }

	function removeChannelShortsTab() {
		if (!config.removeFromChannel) return;

		document.querySelectorAll(SELECTORS.channelShortsTabs.join(',')).forEach(el => {
			const removable = el.closest('tp-yt-paper-tab, yt-tab-shape, .tab-content, .yt-tab-shape-wiz') || el;
			safeHide(removable);
		});
	}

	function redirectFromShortsPage() {
		if (isShortsPage(location.href) && config.disableShortPage) {
			info('Redirecting from Shorts page');
			location.href = 'https://www.youtube.com/';
			return true;
		}
		return false;
	}

	function processElement(element) {
		if (!element || !(element instanceof Element)) return;

		if (isKnownShortNode(element)) {
			safeRemove(element);
			return;
		}

		if (isKnownShortContainer(element) && hasShortLink(element)) {
			safeRemove(element);
			return;
		}

		if (hasShortLink(element) && !hasWatchLink(element)) {
			const shelf = element.closest('ytd-rich-section-renderer, ytd-item-section-renderer, ytd-shelf-renderer, ytd-rich-shelf-renderer');
			if (shelf) {
				safeRemove(shelf);
				return;
			}
		}

		if (element.querySelectorAll) {
			element.querySelectorAll(SELECTORS.shortNodes.join(',')).forEach(safeRemove);

			element.querySelectorAll(SELECTORS.shortContainers.join(',')).forEach(node => {
				if (hasShortLink(node)) safeRemove(node);
			});

			element.querySelectorAll(SELECTORS.shelfContainers.join(',')).forEach(container => {
				if (hasShortLink(container) && !hasWatchLink(container)) {
					const removable =
						container.closest('ytd-rich-section-renderer, ytd-item-section-renderer, ytd-shelf-renderer, ytd-rich-shelf-renderer')
						|| container;
					safeRemove(removable);
				}
			});
		}
	}

	function fullCleanup() {
		if (redirectFromShortsPage()) return;
		if (!shouldRemoveForCurrentPage()) return;

		removeSidebarShorts();
		removeChannelShortsTab();

		document.querySelectorAll(SELECTORS.shortNodes.join(',')).forEach(safeRemove);

		document.querySelectorAll(SELECTORS.shortContainers.join(',')).forEach(node => {
			if (hasShortLink(node)) safeRemove(node);
		});

		document.querySelectorAll(SELECTORS.shelfContainers.join(',')).forEach(container => {
			if (hasShortLink(container) && !hasWatchLink(container)) {
				const removable =
					container.closest('ytd-rich-section-renderer, ytd-item-section-renderer, ytd-shelf-renderer, ytd-rich-shelf-renderer')
					|| container;
				safeRemove(removable);
			}
		});
	}

	function scheduleFullCleanup(reason) {
		if (scheduled) return;
		scheduled = true;

		requestAnimationFrame(() => {
			scheduled = false;
			log('Running cleanup because:', reason);
			fullCleanup();
		});
	}

	function handleMutations(mutations) {
		if (!shouldRemoveForCurrentPage()) return;

		let shouldRunFull = false;

		for (const mutation of mutations) {
			if (mutation.type !== 'childList') continue;

			for (const node of mutation.addedNodes) {
				if (!(node instanceof Element)) continue;

				if (
					isKnownShortNode(node) ||
					isKnownShortContainer(node) ||
					hasShortLink(node) ||
					node.querySelector?.(SELECTORS.shortLinks) ||
					node.querySelector?.(SELECTORS.shortNodes.join(','))
				) {
					processElement(node);
					shouldRunFull = true;
				}
			}
		}

		if (shouldRunFull) {
			scheduleFullCleanup('mutation');
		}
	}

	function startObserver() {
		if (observer) observer.disconnect();

		observer = new MutationObserver(handleMutations);
		observer.observe(document.body, {
			childList: true,
			subtree: true
		});

		log('Observer started');
	}

	function onUrlChanged() {
		if (lastUrl === location.href) return;
		lastUrl = location.href;
		log('URL changed:', lastUrl);
		scheduleFullCleanup('url change');
	}

	function hookSpaNavigation() {
		const originalPushState = history.pushState;
		const originalReplaceState = history.replaceState;

		history.pushState = function (...args) {
			const result = originalPushState.apply(this, args);
			setTimeout(onUrlChanged, 0);
			return result;
		};

		history.replaceState = function (...args) {
			const result = originalReplaceState.apply(this, args);
			setTimeout(onUrlChanged, 0);
			return result;
		};

		window.addEventListener('popstate', () => setTimeout(onUrlChanged, 0));
		window.addEventListener('yt-navigate-finish', () => setTimeout(onUrlChanged, 0));
		window.addEventListener('yt-page-data-updated', () => setTimeout(onUrlChanged, 0));
	}

	function handleScrollBlock(event) {
		if (!config.disableShortPageScrolling) return;
		if (!isShortsPage(location.href)) return;

		if (event.target && event.target.closest) {
			if (
				event.target.closest('#comments') ||
				event.target.closest('ytd-engagement-panel-section-list-renderer')
			) {
				return;
			}
		}

		event.preventDefault();
		location.href = 'https://www.youtube.com/';
	}

	function setupScrollBlock() {
		window.addEventListener('wheel', handleScrollBlock, { passive: false });
		window.addEventListener('scroll', handleScrollBlock, { passive: false });
	}

	function openSettingsPanel() {
		if (settingsPanel) {
			settingsPanel.remove();
			settingsPanel = null;
			return;
		}

		const panel = document.createElement('div');
		panel.id = 'yt-shorts-remover-panel';

		panel.innerHTML = `
			<h2>YouTube Shorts Remover</h2>
			<div class="row"><label>Remove from Start Page</label><input type="checkbox" data-key="removeFromStartPage"></div>
			<div class="row"><label>Remove from Subscription Feed</label><input type="checkbox" data-key="removeFromSubscriptionFeed"></div>
			<div class="row"><label>Remove from All Feeds</label><input type="checkbox" data-key="removeFromAllFeeds"></div>
			<div class="row"><label>Remove from Watch Page</label><input type="checkbox" data-key="removeFromFollowUp"></div>
			<div class="row"><label>Remove from Channel Page</label><input type="checkbox" data-key="removeFromChannel"></div>
			<div class="row"><label>Remove from Search</label><input type="checkbox" data-key="removeFromSearch"></div>
			<div class="row"><label>Remove Sidebar Shorts</label><input type="checkbox" data-key="removeSidebar"></div>
			<div class="row"><label>Disable Shorts Page</label><input type="checkbox" data-key="disableShortPage"></div>
			<div class="row"><label>Disable Shorts Scrolling</label><input type="checkbox" data-key="disableShortPageScrolling"></div>
			<div class="row"><label>Debug Mode</label><input type="checkbox" data-key="debugMode"></div>
			<div class="row"><label>Console Color</label><input type="color" data-key="consoleColor"></div>
			<div class="footer">
				<button id="yt-shorts-remover-run">Run now</button>
				<button id="yt-shorts-remover-close">Close</button>
			</div>
		`;

		panel.querySelectorAll('[data-key]').forEach(input => {
			const key = input.getAttribute('data-key');
			if (input.type === 'checkbox') {
				input.checked = !!config[key];
			} else {
				input.value = config[key];
			}

			input.addEventListener('change', function () {
				const value = this.type === 'checkbox' ? this.checked : this.value;
				saveConfig(key, value);
				scheduleFullCleanup('settings change');
			});
		});

		panel.querySelector('#yt-shorts-remover-run').addEventListener('click', () => {
			scheduleFullCleanup('manual run');
		});

		panel.querySelector('#yt-shorts-remover-close').addEventListener('click', () => {
			panel.remove();
			settingsPanel = null;
		});

		document.body.appendChild(panel);
		settingsPanel = panel;
	}

	function registerMenu() {
		if (typeof GM_registerMenuCommand === 'function') {
			GM_registerMenuCommand('Open YouTube Shorts Remover Settings', openSettingsPanel);
			GM_registerMenuCommand('Run Shorts Cleanup Now', () => scheduleFullCleanup('menu'));
		}
	}

	function init() {
		injectCss();
		registerMenu();
		hookSpaNavigation();
		setupScrollBlock();
		startObserver();
		fullCleanup();
		info('Initialized');
	}

	init();
})();

export async function checkFaviconApiPermission(): Promise<boolean> {
	try {
		return await browser.permissions.contains({permissions: ["favicon"]});
	} catch {
		return false; // Firefox rejects unknown permissions → favicon API absent
	}
}

let hasFaviconApiPermission = true;
if (navigator.userAgent.includes('Firefox')) {
	hasFaviconApiPermission = await checkFaviconApiPermission();
}

/**
 * Favicon served by Chrome's built-in favicon service (needs "favicon" permission).
 */
export function faviconUrl(pageUrl: string, size = 64): string {
	if (!hasFaviconApiPermission) {
		return `https://icons.duckduckgo.com/ip3/${new URL(pageUrl).hostname}.ico`;
	}
	return `${chrome.runtime.getURL("/_favicon/")}?${new URLSearchParams({
		pageUrl,
		size: size.toString(10),
	})}`;
}

/**
 * Minimal debounce, used to coalesce bursts of bookmark change events.
 */
export function debounce(fn: () => void, ms: number): () => void {
	let t: ReturnType<typeof setTimeout> | undefined;
	return () => {
		clearTimeout(t);
		t = setTimeout(fn, ms);
	};
}

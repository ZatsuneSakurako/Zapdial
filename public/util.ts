const ESC: Record<string, string> = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': "&quot;",
	"'": "&#39;",
};

/**
 * Escape untrusted bookmark titles before inserting into innerHTML.
 */
export function escapeHtml(s: string): string {
	return s.replace(/[&<>"']/g, (c) => ESC[c]!);
}

/**
 * Favicon served by Chrome's built-in favicon service (needs "favicon" permission).
 */
export function faviconUrl(pageUrl: string, size = 64): string {
	return `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(pageUrl)}&size=${size}`;
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

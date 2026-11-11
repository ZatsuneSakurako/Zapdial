import type {DialEntry, DialNavigateDetail} from "../types.js";
import {escapeHtml, faviconUrl} from "../util.js";

const FOLDER_ICON =
	'<svg viewBox="0 0 24 24" width="64" height="64" fill="currentColor" aria-hidden="true">' +
	'<path d="M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-2z"/></svg>';

/**
 * A single tile. Bookmarks navigate natively via the anchor;
 * folders intercept the click and dispatch a bubbling custom event
 * that <dial-grid> handles. Light DOM only — no Shadow Root per tile,
 * which keeps mounting hundreds of tiles cheap.
 *
 * IMPORTANT: a custom element constructor must leave the element with
 * NO children and NO attributes (spec rule — Chromium enforces it with
 * "NotSupportedError: The result must not have children"). All DOM
 * construction therefore happens in connectedCallback().
 */
export class DialItem extends HTMLElement {
	#entry: DialEntry | null = null;
	#anchor: HTMLAnchorElement | null = null;

	set entry(entry: DialEntry) {
		this.#entry = entry;
		if (this.isConnected) this.#render();
	}

	/** Build the tile DOM lazily — never in the constructor. */
	connectedCallback(): void {
		if (!this.#anchor) {
			const anchor = document.createElement("a");
			anchor.className = "tile";
			anchor.addEventListener("click", this.#onClick);
			this.#anchor = anchor;
			this.appendChild(anchor);
		}
		if (this.#entry) this.#render();
	}

	#render(): void {
		const anchor = this.#anchor!;
		const entry = this.#entry!;
		const isFolder = entry.kind === "folder";
		anchor.href = isFolder ? "#" : entry.url!;
		anchor.title = entry.title;
		anchor.setAttribute(
			"aria-label",
			isFolder ? `Open folder ${entry.title}` : entry.title
		);

		const media = isFolder
			? `<span class="icon folder-icon">${FOLDER_ICON}</span>`
			: `<img class="icon" src="${faviconUrl(entry.url!)}" alt="" width="128" height="128" loading="lazy" decoding="async">`;
		const count = isFolder ? `<span class="count">${entry.childCount ?? 0}</span>` : "";

		// One innerHTML assignment per tile, built once.
		anchor.innerHTML =
			`${media}<span class="label">${escapeHtml(entry.title)}</span>${count}`;
	}

	#onClick = (ev: MouseEvent): void => {
		const entry = this.#entry;
		if (!entry || entry.kind !== "folder") return; // bookmarks use native navigation
		ev.preventDefault();
		const detail: DialNavigateDetail = { id: entry.id };
		this.dispatchEvent(new CustomEvent<DialNavigateDetail>("dial-navigate", { bubbles: true, detail }));
	};
}

customElements.define("dial-item", DialItem);

declare global {
	interface HTMLElementTagNameMap {
		"dial-item": DialItem;
	}
}

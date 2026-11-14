import type {DialEntry, DialNavigateDetail} from "../types.js";
import {faviconUrl} from "../util.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const FOLDER_ICON_TEMPLATE = (() => {
	const svg = document.createElementNS(SVG_NS, "svg");
	svg.setAttribute("viewBox", "0 0 24 24");
	svg.setAttribute("width", "64");
	svg.setAttribute("height", "64");
	svg.setAttribute("fill", "currentColor");
	svg.setAttribute("aria-hidden", "true");

	const path = document.createElementNS(SVG_NS, "path");
	path.setAttribute(
		"d",
		"M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-2z"
	);
	svg.append(path);
	return svg;
})();

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

	/**
	 * Build the tile DOM lazily — never in the constructor.
	 */
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
		anchor.setAttribute("aria-label", isFolder ? `Open folder ${entry.title}` : entry.title);

		// Rebuild children from scratch each render.
		anchor.replaceChildren();

		const label = document.createElement("span");
		label.className = "label";
		label.textContent = entry.title;

		if (isFolder) {
			const icon = document.createElement("span");
			icon.className = "icon folder-icon";
			icon.append(FOLDER_ICON_TEMPLATE.cloneNode(true));
			anchor.append(icon);

			anchor.append(label);

			const count = document.createElement("span");
			count.className = "count";
			count.textContent = (entry.childCount ?? 0).toString(10);
			anchor.append(count);
		} else {
			const img = document.createElement("img");
			img.className = "icon";
			img.src = faviconUrl(entry.url!);
			img.alt = "";
			img.width = 128;
			img.height = 128;
			img.loading = "lazy";
			img.decoding = "async";
			anchor.append(img);

			anchor.append(label);
		}
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

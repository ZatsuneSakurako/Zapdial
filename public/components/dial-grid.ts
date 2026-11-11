import type {DialEntry, DialNavigateDetail} from "../types.js";
import "./dial-item.js";

type BMNode = chrome.bookmarks.BookmarkTreeNode;

/**
 * Grid + breadcrumb. Owns an in-memory index (Map<id, node>) of the whole
 * "Speed Dial" subtree, so folder navigation is a synchronous Map lookup +
 * one fragment render — no round-trips to chrome.bookmarks.
 */
export class DialGrid extends HTMLElement {
	static #instance:DialGrid|null = null;
	#nodes = new Map<string, BMNode>();
	#rootId = "";
	/** Navigation stack; stack[0] is the Speed Dial root. */
	#stack: string[] = [];
	#crumbs: HTMLElement;
	#grid: HTMLElement;

	constructor() {
		super();
		DialGrid.#instance = this;
		this.#crumbs = document.createElement("nav");
		this.#crumbs.className = "crumbs";
		this.#grid = document.createElement("div");
		this.#grid.className = "grid";
		this.append(this.#crumbs, this.#grid);
		this.addEventListener("dial-navigate", (ev) => {
			this.navigate((ev as CustomEvent<DialNavigateDetail>).detail.id);
		});

		const cssVars = new Set(['bg', 'fg', 'tile-bg', 'tile-fg', 'tile-hover', 'tile-active']);
		for (let cssVar of cssVars) {
			const value = localStorage.getItem(`css-${cssVar}`);
			if (value) {
				document.documentElement.style.setProperty(`--${cssVar}`, value);
			}
		}

	}

	static get instance() {
		if (!this.#instance) throw new Error('NO_DIAL_GRID');
		return this.#instance;
	}

	/** Replace the index wholesale (after a bookmarks reload). */
	set model(nodes: Map<string, BMNode>) {
		this.#nodes = nodes;
	}

	/** Reset navigation to the Speed Dial root and render. */
	open(rootId: string): void {
		this.#rootId = rootId;
		this.#stack = [rootId];
		this.#render();
	}

	navigate(id: string): void {
		if (this.#nodes.has(id)) {
			this.#stack.push(id);
			this.#render();
		}
	}

	#entriesFor(id: string): DialEntry[] {
		const node = this.#nodes.get(id);
		const children = node?.children ?? [];
		const entries: DialEntry[] = [];
		for (const c of children) {
			if (c.url) {
				entries.push({ id: c.id, kind: "bookmark", title: c.title, url: c.url });
			} else {
				entries.push({
					id: c.id,
					kind: "folder",
					title: c.title,
					childCount: c.children?.length ?? 0,
				});
			}
		}
		// Folders first, then alphabetical. localeCompare is cached per pair by the engine.
		entries.sort((a, b) =>
			Number(b.kind === "folder") - Number(a.kind === "folder") ||
			a.title.localeCompare(b.title, undefined, { sensitivity: "base" })
		);
		return entries;
	}

	#render(): void {
		// Breadcrumb (also serves as the back control).
		const crumbs = document.createDocumentFragment();
		const currentId = this.#stack[this.#stack.length - 1]!;
		this.#stack.forEach((id, i) => {
			const isLast = id === currentId;
			const btn = document.createElement(isLast ? "span" : "button");
			btn.className = "crumb" + (isLast ? " current" : "");
			const label = id === this.#rootId ? "Speed Dial" : (this.#nodes.get(id)?.title || "…");
			btn.textContent = i > 0 ? " › " + label : label;
			if (!isLast) {
				if (btn instanceof HTMLButtonElement) {
					btn.type = "button";
				}
				const depth = this.#stack.length - 1 - i;
				btn.addEventListener("click", () => {
					this.#stack.length -= depth; // pop back to this level
					this.#render();
				});
			}
			crumbs.appendChild(btn);
		});
		this.#crumbs.replaceChildren(crumbs);

		// Grid items, all appended in a single fragment → one layout pass.
		const frag = document.createDocumentFragment();
		const entries = this.#entriesFor(currentId);
		for (const entry of entries) {
			const item = document.createElement("dial-item");
			(item as unknown as { entry: DialEntry }).entry = entry; // set before insert = no extra invalidation
			frag.appendChild(item);
		}
		if (entries.length === 0) {
			const empty = document.createElement("p");
			empty.className = "empty";
			empty.textContent = 'No bookmarks here yet — add sites to your "Speed Dial" folder.';
			frag.appendChild(empty);
		}
		this.#grid.replaceChildren(frag);
	}
}

customElements.define("dial-grid", DialGrid);

declare global {
	interface HTMLElementTagNameMap {
		"dial-grid": DialGrid;
	}
}

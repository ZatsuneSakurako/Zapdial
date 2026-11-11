export type DialKind = "bookmark" | "folder";

/** Flat view-model entry handed to a tile. */
export interface DialEntry {
	id: string;
	kind: DialKind;
	title: string;
	/** Only for kind === "bookmark". */
	url?: string;
	/** Only for kind === "folder". */
	childCount?: number;
}

/** Event fired (bubbling) by <dial-item> when a folder tile is clicked. */
export interface DialNavigateDetail {
	id: string;
}

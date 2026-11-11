import "./components/dial-grid.js";
import {debounce} from "./util.js";
import {DialGrid} from "./components/dial-grid.js";

const FOLDER_TITLE = "Speed Dial";
const CACHE_KEY = "speedDialSubtree";

type BMNode = chrome.bookmarks.BookmarkTreeNode;

const grid = DialGrid.instance;

/** Depth-first search for the first folder named "Speed Dial". */
async function findFolder(): Promise<BMNode | null> {
	const tree = await chrome.bookmarks.getTree();
	const stack: BMNode[] = [...tree];
	while (stack.length) {
		const node = stack.pop()!;
		if (!node.url && node.title === FOLDER_TITLE) return node;
		if (node.children) stack.push(...node.children);
	}
	return null;
}

/** Index the folder + all descendants into a Map (single synchronous source of truth). */
function indexSubtree(root: BMNode): Map<string, BMNode> {
	const map = new Map<string, BMNode>();
	const stack: BMNode[] = [root];
	while (stack.length) {
		const node = stack.pop()!;
		map.set(node.id, node);
		if (node.children) stack.push(...node.children);
	}
	return map;
}

function apply(root: BMNode): void {
	(grid as unknown as { model: Map<string, BMNode> }).model = indexSubtree(root);
	(grid as unknown as { open(id: string): void }).open(root.id);
}

async function reload(): Promise<void> {
	const folder = await findFolder();
	if (!folder) {
		// Folder was deleted — recreate it so the dial is never dead.
		const created = await chrome.bookmarks.create({ parentId: "1", title: FOLDER_TITLE });
		apply({ ...created, children: [] });
		return;
	}
	apply(folder);
	// Snapshot for next launch's instant first paint.
	chrome.storage.session.set({ [CACHE_KEY]: folder }).catch(() => {});
}

async function init(): Promise<void> {
	// 1) Paint immediately from the session snapshot, if present.
	try {
		const { [CACHE_KEY]: cached } = await chrome.storage.session.get(CACHE_KEY);
		if (cached) apply(cached as BMNode);
	} catch {
		/* no cache — fall through to the real load */
	}

	// 2) Reconcile with live bookmark data.
	await reload();

	// 3) Keep live: coalesce bursts of bookmark mutations into one reload.
	const schedule = debounce(reload, 150);
	chrome.bookmarks.onCreated.addListener(schedule);
	chrome.bookmarks.onRemoved.addListener(schedule);
	chrome.bookmarks.onChanged.addListener(schedule);
	chrome.bookmarks.onMoved.addListener(schedule);
}

init();

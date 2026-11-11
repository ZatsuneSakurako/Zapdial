const FOLDER_TITLE = "Speed Dial";

async function folderExists(): Promise<boolean> {
	const tree = await chrome.bookmarks.getTree();
	const stack: chrome.bookmarks.BookmarkTreeNode[] = [...tree];
	while (stack.length) {
		const node = stack.pop()!;
		if (!node.url && node.title === FOLDER_TITLE) return true;
		if (node.children) stack.push(...node.children);
	}
	return false;
}

// Create the source folder on install so the dial works out of the box.
chrome.runtime.onInstalled.addListener(async ({ reason }) => {
	if (reason === "install" || reason === "update") {
		if (!(await folderExists())) {
			await chrome.bookmarks.create({ parentId: "1", title: FOLDER_TITLE });
		}
	}
});

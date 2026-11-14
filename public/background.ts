const FOLDER_TITLE = "Speed Dial";

async function folderExists(): Promise<boolean> {
	const matches = await chrome.bookmarks.search({ title: FOLDER_TITLE });
	return matches.some((node) => !node.url); // folders have no `url`
}

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
	if (reason !== "install" && reason !== "update") return;
	if (await folderExists()) return;

	await chrome.bookmarks.create({ title: FOLDER_TITLE });
});

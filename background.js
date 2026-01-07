// background.js

// Listens for the extension icon click to toggle the sidebar
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.tabs.sendMessage(tab.id, { action: "toggle_sidebar" }, (response) => {
      if (chrome.runtime.lastError) {
        console.log("Prompt Navigator: Tab connection error (expected on unsupported pages).");
      }
    });
  }
});

// Listens for theme change messages from content.js to update the toolbar icon
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "update_icon") {
    const theme = request.theme === "dark" ? "dark" : "light";
    chrome.action.setIcon({
      path: {
        "16": `images/icon${theme}16.png`,
        "48": `images/icon${theme}48.png`,
        "128": `images/icon${theme}128.png`
      },
      tabId: sender.tab.id
    });
  }
});
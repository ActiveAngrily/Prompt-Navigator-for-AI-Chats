// background.js

chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.tabs.sendMessage(tab.id, { action: "toggle_sidebar" }, (response) => {
      if (chrome.runtime.lastError) {
        // This error is expected if the content script isn't on the current page.
        // We can safely ignore it, but we'll log it for debugging purposes.
        console.log(`Prompt Navigator: Could not establish connection with tab ${tab.id}. This is expected on pages where the content script is not injected.`);
      }
    });
  }
});
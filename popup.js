// popup.js

function sendMessageToContentScript(message) {
  // Find the current active tab in the current window.
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (tabs.length > 0 && tabs[0].id) {
      // Send the message to the content script.
      // The empty function () => {} is a callback that prevents the
      // "Receiving end does not exist" error if the content script
      // isn't available on the current page.
      chrome.tabs.sendMessage(tabs[0].id, message, () => {
        if (chrome.runtime.lastError) {
          // This is expected on pages without the content script, so we can ignore it.
        }
      });
    }
  });
}

// Add an event listener for when the popup's HTML has fully loaded.
document.addEventListener('DOMContentLoaded', function() {
  // Immediately send the 'toggle_sidebar' message as soon as the popup is opened.
  sendMessageToContentScript({ action: "toggle_sidebar" });
  
  // Close the popup right away.
  setTimeout(() => {
    window.close();
  }, 100);
});

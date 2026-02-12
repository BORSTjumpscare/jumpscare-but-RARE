// Track focused tab
let focusedTabId = null;

// When a tab becomes active
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  focusedTabId = activeInfo.tabId;
});

// When window focus changes
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    focusedTabId = null;
    return;
  }

  const tabs = await chrome.tabs.query({
    active: true,
    windowId: windowId
  });

  focusedTabId = tabs.length > 0 ? tabs[0].id : null;
});

// Respond to content script focus checks
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "checkFocus") {
    const isFocused = sender.tab && sender.tab.id === focusedTabId;
    sendResponse({ isFocused: isFocused });
  }
});

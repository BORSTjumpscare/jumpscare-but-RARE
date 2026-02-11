let activeTabId = null;

// Track tab focus
chrome.tabs.onActivated.addListener(activeInfo => {
    activeTabId = activeInfo.tabId;
});

chrome.windows.onFocusChanged.addListener(windowId => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
        activeTabId = null; // lost focus
    } else {
        chrome.tabs.query({ active: true, windowId: windowId }, tabs => {
            if (tabs.length) activeTabId = tabs[0].id;
        });
    }
});

// Respond to content script focus check
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === "checkFocus") {
        const isFocused = sender.tab && sender.tab.id === activeTabId;
        sendResponse({ isFocused: !!isFocused });
    }
});

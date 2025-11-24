// Listen for messages from the popup
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getLocalStorage") {
        // Read all local storage items
        const data = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            data[key] = localStorage.getItem(key);
        }
        sendResponse({ data: data });
    } else if (request.action === "setLocalStorage") {
        // Update a specific item
        try {
            localStorage.setItem(request.key, request.value);
            sendResponse({ success: true });
        } catch (e) {
            sendResponse({ success: false, error: e.toString() });
        }
    } else if (request.action === "removeLocalStorage") {
        // Remove a specific item
        localStorage.removeItem(request.key);
        sendResponse({ success: true });
    } else if (request.action === "clearLocalStorage") {
        // Clear all
        localStorage.clear();
        sendResponse({ success: true });
    }
});

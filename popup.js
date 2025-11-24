// Helper to send message to active tab
function sendMessageToTab(message) {
    return browser.tabs.query({active: true, currentWindow: true})
        .then(tabs => {
            if (tabs.length === 0) return;
            return browser.tabs.sendMessage(tabs[0].id, message);
        });
}

let currentData = {};

// Load items
function loadItems() {
    sendMessageToTab({ action: "getLocalStorage" })
        .then(response => {
            const list = document.getElementById("storage-list");
            const emptyState = document.getElementById("empty-state");
            list.innerHTML = "";
            
            if (!response || !response.data || Object.keys(response.data).length === 0) {
                emptyState.classList.remove("hidden");
                currentData = {};
                return;
            }

            emptyState.classList.add("hidden");
            currentData = response.data;
            renderList(currentData);
        })
        .catch(err => console.error("Error loading items:", err));
}

function renderList(data, filter = "") {
    const list = document.getElementById("storage-list");
    list.innerHTML = "";
    
    const entries = Object.entries(data).filter(([key, value]) => {
        const term = filter.toLowerCase();
        return key.toLowerCase().includes(term) || String(value).toLowerCase().includes(term);
    });

    if (entries.length === 0 && filter) {
        list.innerHTML = '<li style="text-align:center; padding: 20px; color: var(--text-muted);">No matches found</li>';
        return;
    }

    entries.forEach(([key, value]) => {
        const li = document.createElement("li");
        li.className = "storage-item";
        li.onclick = (e) => {
            // Don't trigger edit if clicking buttons
            if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
            openModal(key, value);
        };

        const header = document.createElement("div");
        header.className = "item-header";

        const keySpan = document.createElement("span");
        keySpan.className = "item-key";
        keySpan.textContent = key;

        const actions = document.createElement("div");
        actions.className = "item-actions";

        const copyBtn = document.createElement("button");
        copyBtn.className = "action-btn";
        copyBtn.innerHTML = "📋";
        copyBtn.title = "Copy Value";
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(value);
            showToast("Value copied!");
        };

        const delBtn = document.createElement("button");
        delBtn.className = "action-btn delete";
        delBtn.innerHTML = "🗑️";
        delBtn.title = "Delete";
        delBtn.onclick = () => deleteItem(key);

        actions.appendChild(copyBtn);
        actions.appendChild(delBtn);

        header.appendChild(keySpan);
        header.appendChild(actions);

        const valueDiv = document.createElement("div");
        valueDiv.className = "item-value";
        valueDiv.textContent = value;

        li.appendChild(header);
        li.appendChild(valueDiv);
        list.appendChild(li);
    });
}

// Save item
function saveItem(key, value) {
    sendMessageToTab({ action: "setLocalStorage", key: key, value: value })
        .then(() => {
            loadItems();
            closeModal();
            showToast("Item saved successfully");
        });
}

// Delete item
function deleteItem(key) {
    showConfirmModal(`Are you sure you want to delete "${key}"?`, () => {
        sendMessageToTab({ action: "removeLocalStorage", key: key })
            .then(() => {
                loadItems();
                showToast("Item deleted");
            });
    });
}

// Modal Logic
const modal = document.getElementById("modal");
const modalKey = document.getElementById("modal-key");
const modalValue = document.getElementById("modal-value");
const modalTitle = document.getElementById("modal-title");

function openModal(key = "", value = "") {
    modalKey.value = key;
    modalValue.value = value;
    
    if (key) {
        modalTitle.textContent = "Edit Item";
        modalKey.disabled = true; // Can't change key when editing
    } else {
        modalTitle.textContent = "Add New Item";
        modalKey.disabled = false;
    }
    
    modal.classList.add("visible");
}

function closeModal() {
    modal.classList.remove("visible");
}

document.getElementById("modal-cancel").addEventListener("click", closeModal);
document.getElementById("modal-save").addEventListener("click", () => {
    const key = modalKey.value.trim();
    const value = modalValue.value;
    
    if (!key) {
        alert("Key is required");
        return;
    }
    
    saveItem(key, value);
});

// Search
document.getElementById("search-input").addEventListener("input", (e) => {
    renderList(currentData, e.target.value);
});

// Clear all
document.getElementById("clear-btn").addEventListener("click", () => {
    showConfirmModal("Are you sure you want to clear ALL Local Storage? This cannot be undone.", () => {
        sendMessageToTab({ action: "clearLocalStorage" })
            .then(() => {
                loadItems();
                showToast("All items cleared");
            });
    });
});

// Custom Confirm Modal Logic
const confirmModal = document.getElementById("confirm-modal");
const confirmMessage = document.getElementById("confirm-message");
const confirmYesBtn = document.getElementById("confirm-yes");
const confirmNoBtn = document.getElementById("confirm-no");
let confirmCallback = null;

function showConfirmModal(message, onConfirm) {
    confirmMessage.textContent = message;
    confirmCallback = onConfirm;
    confirmModal.classList.add("visible");
}

function closeConfirmModal() {
    confirmModal.classList.remove("visible");
    confirmCallback = null;
}

confirmYesBtn.addEventListener("click", () => {
    if (confirmCallback) confirmCallback();
    closeConfirmModal();
});

confirmNoBtn.addEventListener("click", closeConfirmModal);

// Refresh
document.getElementById("refresh-btn").addEventListener("click", () => {
    loadItems();
    showToast("Refreshed");
});

// Add new item button
document.getElementById("add-btn").addEventListener("click", () => openModal());

// Toast
function showToast(msg) {
    const toast = document.getElementById("toast");
    toast.textContent = msg;
    toast.classList.add("visible");
    setTimeout(() => {
        toast.classList.remove("visible");
    }, 2000);
}

// Initial load
document.addEventListener("DOMContentLoaded", loadItems);

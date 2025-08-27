// content.js — Prompt Navigator for AI Chats (Compact Chrome-like UI with 2-line wrap)
// Final Refactored Version

console.log("Prompt Navigator for AI Chats — Cleaned & Refactored");

// --- SITE-SPECIFIC CONFIGURATION ---
const SITE_CONFIGS = {
  "chat.openai.com": {
    promptSelector: "div[data-message-author-role='user']",
    extractText: (node) => {
        const textContainer = node.querySelector('div.whitespace-pre-wrap');
        return textContainer ? textContainer.textContent.trim() : '';
    }
  },
  "chatgpt.com": {
    promptSelector: "div[data-message-author-role='user']",
    extractText: (node) => {
        const textContainer = node.querySelector('div.whitespace-pre-wrap');
        return textContainer ? textContainer.textContent.trim() : '';
    }
  },
  "gemini.google.com": {
    promptSelector: ".query-text",
    extractText: (node) => node.textContent.trim()
  }
};

function getCurrentSiteConfig() {
  const hostname = window.location.hostname;
  return SITE_CONFIGS[hostname];
}


// --- CONFIGURATION ---
const MIN_WIDTH = 260; // Minimum width for the resizable sidebar
const MAX_WIDTH = 560; // Maximum width for the resizable sidebar
const START_WIDTH = 320; // The sidebar's initial width
const SCAN_DEBOUNCE_MS = 150; // A small delay to prevent the scanner from running too often

// --- STYLES ---
// All CSS for the sidebar is encapsulated here. It supports both light and dark modes.
const styles = `
  /* Import the Inter font from Google Fonts */
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap');

  :host {
    --transition-fast: 140ms;
    --accent: #1a73e8;
    --border: #e0e0e0;
    --bg: #ffffff;
    --text: #202124;
    --bg-muted: #f5f6f7;
    --hover: #f1f3f4;
    --shadow: -2px 0 10px rgba(0,0,0,0.06);
    font-size: 16px;
  }

  @media (prefers-color-scheme: dark) {
    :host {
      --border: #3c4043;
      --bg: #202124;
      --text: #e8eaed;
      --bg-muted: #2a2b2e;
      --hover: #303134;
      --shadow: -2px 0 12px rgba(0,0,0,0.35);
    }
  }

  .sidebar-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100vh;
    background: var(--bg);
    color: var(--text);
    border-left: 1px solid var(--border);
    box-shadow: var(--shadow);
    /* Set the font for the entire container */
    font-family: 'Inter', sans-serif;
    contain: content;
  }

  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 6px;
    padding: 8px;
    background: var(--bg-muted);
    border-bottom: 1px solid var(--border);
  }

  .icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 6px;
    background: transparent;
    cursor: pointer;
    transition: background var(--transition-fast), transform var(--transition-fast);
    padding: 0;
  }

  .icon-btn:hover {
    background: var(--hover);
  }

  .icon-btn:active {
    transform: scale(0.98);
  }

  .icon-btn svg {
    width: 18px;
    height: 18px;
    fill: currentColor;
    color: var(--text);
  }
  
  .icon-btn.loading svg {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .search-wrap {
    padding: 8px; /* Consistent padding */
    border-bottom: 1px solid var(--border);
  }

  .search-rel {
    position: relative;
    display: flex; /* Use flexbox for alignment */
    align-items: center;
  }

  .search-icon {
    position: absolute;
    left: 8px;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    display: flex;
    align-items: center;
  }

  .search-icon svg {
    /* Adjusted icon size */
    width: 15px;
    height: 15px;
    fill: currentColor;
    color: var(--text);
  }

  .search-input {
    width: 100%;
    height: 32px;
    padding: 0 12px 0 32px;
    font-size: 14px;
    border: 1px solid var(--border);
    border-radius: 8px;
    outline: none;
    background: var(--bg);
    color: var(--text);
    box-sizing: border-box;
    transition: border-color 0.2s, box-shadow 0.2s;
    /* Explicitly set the font for the input */
    font-family: 'Inter', sans-serif;
  }

  .search-input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.2);
  }

  .sidebar-list {
    list-style: none;
    margin: 0;
    padding: 6px 0;
    flex: 1 1 auto;
    overflow: auto;
  }

  .sidebar-list li {
    margin: 0;
  }

  .item {
    display: flex;
    /* This is the fix: Vertically centers the icon with the text */
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 10px;
    background: transparent;
    border: none;
    text-align: left;
    /* Adjusted font size */
    font-size: 13px;
    color: var(--text);
    cursor: pointer;
    overflow: hidden;
    transition: background var(--transition-fast);
     /* Explicitly set the font for list items */
    font-family: 'Inter', sans-serif;
  }

  .item:hover {
    background: var(--hover);
  }

  .item svg {
    /* Adjusted icon size */
    width: 15px;
    height: 15px;
    fill: currentColor;
    color: var(--text);
    flex: 0 0 auto;
  }

  .item span {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: normal;
    line-height: 1.4;
    flex: 1 1 auto;
  }

  .empty {
    padding: 14px;
    font-size: 13px;
    opacity: 0.75;
    text-align: center;
  }

  .resize-handle {
    position: absolute;
    left: -4px;
    top: 0;
    width: 8px;
    height: 100vh;
    cursor: ew-resize;
    background: transparent;
  }

  .resizing * {
    user-select: none !important;
    cursor: ew-resize !important;
  }

  .sidebar-list::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }

  .sidebar-list::-webkit-scrollbar-thumb {
    background: rgba(128, 128, 128, 0.35);
    border-radius: 8px;
  }

  .sidebar-list::-webkit-scrollbar-thumb:hover {
    background: rgba(128, 128, 128, 0.5);
  }
`;

// --- GLOBAL STATE ---
let shadowRoot = null;
let hostEl = null;
let widthPx = START_WIDTH;
const siteConfig = getCurrentSiteConfig(); // Get the config for the current site

// --- UTILITY FUNCTIONS ---
function debounce(fn, ms) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}

const Icons = {
  promptItem: `<svg viewBox="0 0 24 24"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg>`,
  close: `<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`,
  search: `<svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zM9.5 14C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>`,
  sync: `<svg viewBox="0 0 24 24"><path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z"/></svg>`
};

// --- CORE FUNCTIONS ---

/**
 * Finds all prompts on the page, filters them by the search term,
 * and renders them to the sidebar list.
 */
function scanForPrompts() {
  if (!shadowRoot || !siteConfig) return;
  const listEl = shadowRoot.querySelector(".sidebar-list");
  const searchInput = shadowRoot.querySelector(".search-input");
  if (!listEl || !searchInput) return;

  const searchVal = (searchInput.value || "").toLowerCase();
  const promptNodes = document.querySelectorAll(siteConfig.promptSelector);
  
  const fragment = document.createDocumentFragment();
  let itemsFound = 0;

  promptNodes.forEach((node) => {
    const text = siteConfig.extractText(node);
    
    if (!text || (searchVal && !text.toLowerCase().includes(searchVal))) {
      return;
    }

    itemsFound++;
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.className = "item";
    
    const textSpan = document.createElement('span');
    textSpan.textContent = text;
    
    btn.innerHTML = Icons.promptItem;
    btn.appendChild(textSpan);
    
    btn.title = text;
    btn.addEventListener("click", () => {
      node.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    li.appendChild(btn);
    fragment.appendChild(li);
  });
  
  listEl.innerHTML = "";
  if (itemsFound > 0) {
    listEl.appendChild(fragment);
  } else {
    const emptyMsg = document.createElement("div");
    emptyMsg.className = "empty";
    emptyMsg.textContent = searchVal ? "No results found" : "No prompts found on this page.";
    listEl.appendChild(emptyMsg);
  }
}

/**
 * Toggles the visibility of the sidebar with a sliding animation.
 */
function toggleSidebar() {
  if (!hostEl) return;
  const isVisible = hostEl.style.transform.includes("translateX(0%)");
  hostEl.style.transform = isVisible ? "translateZ(0) translateX(100%)" : "translateZ(0) translateX(0%)";
}

/**
 * Finds the correct scrollable container for the chat history.
 */
function findScrollableContainer() {
    if (!siteConfig) return document.documentElement;
    let current = document.querySelector(siteConfig.promptSelector);
    if (!current) return document.documentElement;

    while (current && current !== document.body) {
        const style = window.getComputedStyle(current);
        if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
            return current;
        }
        current = current.parentElement;
    }
    
    return document.documentElement;
}


/**
 * Scrolls to the top of the page to load all content, then scans.
 */
async function deepScan() {
    const tocBtn = shadowRoot.getElementById("tocBtn");
    if (!tocBtn || tocBtn.classList.contains('loading')) return;

    tocBtn.classList.add('loading');
    tocBtn.disabled = true;

    const scrollableElement = findScrollableContainer();
    const originalScrollTop = scrollableElement.scrollTop;

    let lastScrollTop = -1;
    let consecutiveStops = 0;
    const maxConsecutiveStops = 3;

    while (consecutiveStops < maxConsecutiveStops) {
        lastScrollTop = scrollableElement.scrollTop;
        scrollableElement.scrollTo({ top: 0, behavior: 'auto' });
        await new Promise(resolve => setTimeout(resolve, 300));

        if (scrollableElement.scrollTop >= lastScrollTop) {
            consecutiveStops++;
        } else {
            consecutiveStops = 0;
        }
    }
    
    scanForPrompts();

    scrollableElement.scrollTo({ top: originalScrollTop, behavior: 'smooth' });
    
    tocBtn.classList.remove('loading');
    tocBtn.disabled = false;
}

/**
 * Creates the sidebar, injects it into the page, and sets up all its event listeners.
 */
function buildSidebar() {
  if (document.getElementById("chat-toc-host")) return;

  hostEl = document.createElement("div");
  hostEl.id = "chat-toc-host";
  Object.assign(hostEl.style, {
    position: "fixed",
    top: "0",
    right: "0",
    height: "100vh",
    width: `${widthPx}px`,
    zIndex: "2147483647",
    transform: "translateZ(0) translateX(0%)",
    transition: "transform 300ms cubic-bezier(0.4, 0, 0.2, 1)"
  });

  shadowRoot = hostEl.attachShadow({ mode: "open" });

  const styleEl = document.createElement("style");
  styleEl.textContent = styles;

  const container = document.createElement("div");
  container.className = "sidebar-container";
  container.innerHTML = `
    <div class="resize-handle"></div>
    <div class="toolbar">
      <button class="icon-btn" id="tocBtn" title="Deep Scan">${Icons.sync}</button>
      <button class="icon-btn" id="closeBtn" title="Hide">${Icons.close}</button>
    </div>
    <div class="search-wrap">
      <div class="search-rel">
        <span class="search-icon">${Icons.search}</span>
        <input class="search-input" type="text" placeholder="Search" />
      </div>
    </div>
    <ul class="sidebar-list"></ul>
  `;

  shadowRoot.appendChild(styleEl);
  shadowRoot.appendChild(container);
  document.body.appendChild(hostEl);

  // --- Event Listeners ---
  const debouncedScan = debounce(scanForPrompts, SCAN_DEBOUNCE_MS);
  shadowRoot.getElementById("closeBtn").addEventListener("click", toggleSidebar);
  shadowRoot.getElementById("tocBtn").addEventListener("click", deepScan);
  
  const searchInput = shadowRoot.querySelector(".search-input");
  searchInput.addEventListener("input", debouncedScan);
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      searchInput.value = "";
      debouncedScan();
    }
  });

  // --- Resizing Logic ---
  const handle = shadowRoot.querySelector(".resize-handle");
  let rafId = 0;

  const onMove = (ev) => {
    const clientX = ev.touches ? ev.touches[0].clientX : ev.clientX;
    widthPx = Math.min(Math.max(window.innerWidth - clientX, MIN_WIDTH), MAX_WIDTH);
    if (!rafId) {
      rafId = requestAnimationFrame(() => {
        hostEl.style.width = `${widthPx}px`;
        rafId = 0;
      });
    }
  };

  const onUp = () => {
    document.body.classList.remove("resizing");
    document.removeEventListener("mousemove", onMove, true);
    document.removeEventListener("mouseup", onUp, true);
    document.removeEventListener("touchmove", onMove, { capture: true });
    document.removeEventListener("touchend", onUp, { capture: true });
  };

  const onDown = (e) => {
    document.body.classList.add("resizing");
    document.addEventListener("mousemove", onMove, true);
    document.addEventListener("mouseup", onUp, true);
    e.preventDefault();
  };
  
  const onTouchStart = (e) => {
    document.body.classList.add("resizing");
    document.addEventListener("touchmove", onMove, { passive: false, capture: true });
    document.addEventListener("touchend", onUp, { capture: true });
    e.preventDefault();
  };

  handle.addEventListener("mousedown", onDown);
  handle.addEventListener("touchstart", onTouchStart);
}


// --- INITIALIZATION ---

/**
 * Ensures the sidebar exists and then runs a scan for prompts.
 */
function ensureSidebarAndScan() {
  if (!siteConfig) {
      console.log("Prompt Navigator: This site is not supported.");
      return;
  }
  
  if (!document.getElementById("chat-toc-host")) {
    buildSidebar();
  }
  debounce(scanForPrompts, SCAN_DEBOUNCE_MS)();
}

// Initial run
ensureSidebarAndScan();

// Watch for page changes and re-run the initialization.
// We target 'main' as it's a common container for the chat content on supported sites,
// falling back to the body if it's not found. This is more performant.
const targetNode = document.querySelector('main') || document.body;
new MutationObserver(ensureSidebarAndScan).observe(targetNode, {
  childList: true,
  subtree: true
});

// Listen for the toggle command from the background script.
if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((req) => {
    if (req.action === "toggle_sidebar") {
      if (!siteConfig) return true; // Don't try to build if the site isn't supported
      if (!document.getElementById("chat-toc-host")) {
        buildSidebar();
      }
      toggleSidebar();
    }
    return true;
  });
}
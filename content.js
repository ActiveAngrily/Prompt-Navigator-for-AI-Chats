// content.js — Prompt Navigator for AI Chats (Compact Chrome-like UI with 2-line wrap)
// Final Refactored Version

console.log("Prompt Navigator for AI Chats — Cleaned & Refactored");

// --- CONFIGURATION ---
const PROMPT_SELECTOR = ".query-text"; // The CSS selector for the main prompt container
const MIN_WIDTH = 260; // Minimum width for the resizable sidebar
const MAX_WIDTH = 560; // Maximum width for the resizable sidebar
const START_WIDTH = 320; // The sidebar's initial width
const SCAN_DEBOUNCE_MS = 150; // A small delay to prevent the scanner from running too often

// --- STYLES ---
// All CSS for the sidebar is encapsulated here. It supports both light and dark modes.
const styles = `
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
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    contain: content;
  }

  .toolbar {
    display: flex;
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
    padding: 6px 8px;
    border-bottom: 1px solid var(--border);
  }

  .search-rel {
    position: relative;
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
    width: 14px;
    height: 14px;
    fill: currentColor;
    color: var(--text);
  }

  .search-input {
    width: 100%;
    height: 28px;
    padding: 0 8px 0 26px;
    font-size: 13px;
    border: 1px solid var(--border);
    border-radius: 6px;
    outline: none;
    background: var(--bg);
    color: var(--text);
    transition: border var(--transition-fast);
  }

  .search-input:focus {
    border-color: var(--accent);
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
    align-items: flex-start;
    gap: 8px;
    width: 100%;
    padding: 8px 10px;
    background: transparent;
    border: none;
    text-align: left;
    font-size: 13px;
    color: var(--text);
    cursor: pointer;
    overflow: hidden;
    transition: background var(--transition-fast);
  }

  .item:hover {
    background: var(--hover);
  }

  .item svg {
    width: 14px;
    height: 14px;
    fill: currentColor;
    color: var(--text);
    flex: 0 0 auto;
    margin-top: 2px; /* Align icon with first line of text */
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

// --- UTILITY FUNCTIONS ---
function debounce(fn, ms) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}

const Icons = {
  promptItem: `<svg viewBox="0 0 24 24"><path d="M4 6h10v2H4V6zm0 5h16v2H4v-2zm0 5h10v2H4v-2z"/></svg>`,
  collapse: `<svg viewBox="0 0 24 24"><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"/></svg>`,
  search: `<svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zM9.5 14C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>`,
  reload: `<svg viewBox="0 0 24 24"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>`
};

// --- CORE FUNCTIONS ---

/**
 * Finds all prompts on the page, filters them by the search term,
 * and renders them to the sidebar list.
 */
function scanForPrompts() {
  if (!shadowRoot) return;
  const listEl = shadowRoot.querySelector(".sidebar-list");
  const searchInput = shadowRoot.querySelector(".search-input");
  if (!listEl || !searchInput) return;

  const searchVal = (searchInput.value || "").toLowerCase();
  const promptNodes = document.querySelectorAll(PROMPT_SELECTOR);
  
  const fragment = document.createDocumentFragment();
  let itemsFound = 0;

  promptNodes.forEach((node) => {
    const paragraphs = node.querySelectorAll('p');
    const text = Array.from(paragraphs).map(p => p.textContent).join(' ').trim();
    
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
    emptyMsg.textContent = searchVal ? "No results found" : "No prompts found";
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
    let current = document.querySelector(PROMPT_SELECTOR);
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
    transition: "transform var(--transition-fast) ease-out"
  });

  shadowRoot = hostEl.attachShadow({ mode: "open" });

  const styleEl = document.createElement("style");
  styleEl.textContent = styles;

  const container = document.createElement("div");
  container.className = "sidebar-container";
  container.innerHTML = `
    <div class="resize-handle"></div>
    <div class="toolbar">
      <button class="icon-btn" id="collapseBtn" title="Hide">${Icons.collapse}</button>
      <button class="icon-btn" id="tocBtn" title=" Rescan">${Icons.reload}</button>
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
  shadowRoot.getElementById("collapseBtn").addEventListener("click", toggleSidebar);
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
  let isResizing = false;
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
    isResizing = false;
    document.body.classList.remove("resizing");
    document.removeEventListener("mousemove", onMove, true);
    document.removeEventListener("mouseup", onUp, true);
    document.removeEventListener("touchmove", onMove, { capture: true });
    document.removeEventListener("touchend", onUp, { capture: true });
  };

  const onDown = (e) => {
    isResizing = true;
    document.body.classList.add("resizing");
    document.addEventListener("mousemove", onMove, true);
    document.addEventListener("mouseup", onUp, true);
    e.preventDefault();
  };
  
  const onTouchStart = (e) => {
    isResizing = true;
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
  if (!document.getElementById("chat-toc-host")) {
    buildSidebar();
  }
  debounce(scanForPrompts, SCAN_DEBOUNCE_MS)();
}

// Initial run
ensureSidebarAndScan();

// Watch for page changes and re-run the initialization.
new MutationObserver(ensureSidebarAndScan).observe(document.body, {
  childList: true,
  subtree: true
});

// Listen for the toggle command from the popup.
if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((req) => {
    if (req.action === "toggle_sidebar") {
      if (!document.getElementById("chat-toc-host")) {
        buildSidebar();
      }
      toggleSidebar();
    }
    return true;
  });
}

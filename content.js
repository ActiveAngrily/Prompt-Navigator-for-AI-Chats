// content.js — Prompt Navigator (Gemini-Inspired)
console.log("Prompt Navigator: Fixed Deep Scan & Corrected Icon Visibility");

const SITE_CONFIGS = {
  "chat.openai.com": {
    promptSelector: "div[data-message-author-role='user']",
    scrollContainer: "div[class*='react-scroll-to-bottom']",
    extractText: (node) => node.querySelector('div.whitespace-pre-wrap')?.textContent.trim() || ''
  },
  "chatgpt.com": {
    promptSelector: "div[data-message-author-role='user']",
    scrollContainer: "div[class*='react-scroll-to-bottom']",
    extractText: (node) => node.querySelector('div.whitespace-pre-wrap')?.textContent.trim() || ''
  },
  "gemini.google.com": {
    promptSelector: ".query-text",
    scrollContainer: ".discussion-container",
    extractText: (node) => node.textContent.trim()
  }
};

const getCurrentConfig = () => SITE_CONFIGS[window.location.hostname];
const getAssetUrl = (name) => chrome.runtime.getURL(`images/${name}.png`);

// --- UI STYLES ---
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500&display=swap');

  :host {
    --bg: #ffffff;
    --text: #1f1f1f;
    --border: #dadce0;
    --accent: #1a73e8;
    --hover: #f1f3f4;
    --icon-tint: #5f6368;
    --prompt-icon-bg: #e8eaed; 
    --font-main: 'Google Sans', sans-serif;
    /* Show DARK icon on LIGHT background */
    --logo-url: url('${getAssetUrl('icondark48')}');
  }

  @media (prefers-color-scheme: dark) {
    :host {
      --bg: #131314;
      --text: #e3e3e3;
      --border: #444746;
      --hover: #282a2d;
      --icon-tint: #c4c7c5;
      --prompt-icon-bg: #333537;
      /* Show LIGHT icon on DARK background */
      --logo-url: url('${getAssetUrl('iconlight48')}');
    }
  }

  .sidebar-container {
    display: flex; flex-direction: column; width: 100%; height: 100vh;
    background: var(--bg); color: var(--text); border-left: 1px solid var(--border);
    font-family: var(--font-main); box-sizing: border-box; overflow: hidden;
    box-shadow: -4px 0 12px rgba(0,0,0,0.05);
  }

  .toolbar {
    display: flex; justify-content: space-between; align-items: center;
    padding: 16px 20px; border-bottom: 1px solid var(--border);
  }

  .logo-img {
    width: 28px; height: 28px;
    background-image: var(--logo-url);
    background-size: contain; background-repeat: no-repeat;
  }

  .icon-btn {
    width: 40px; height: 40px; border: none; border-radius: 50%;
    background: transparent; cursor: pointer; color: var(--icon-tint);
    display: flex; align-items: center; justify-content: center;
    transition: background 0.2s;
  }
  .icon-btn:hover { background: var(--hover); }
  .icon-btn svg { width: 22px; height: 22px; fill: currentColor; }

  .search-wrap { padding: 12px 16px; position: relative; }
  .search-input {
    width: 100%; height: 48px; padding: 0 16px 0 44px;
    font-size: 16px; 
    border: 1px solid var(--border); border-radius: 24px;
    background: var(--bg); color: var(--text); outline: none;
    box-sizing: border-box;
  }

  .search-icon-fixed {
    position: absolute; left: 30px; top: 50%; transform: translateY(-50%);
    color: var(--icon-tint); display: flex; pointer-events: none;
  }

  .sidebar-list { flex: 1; overflow-y: auto; padding: 8px 0; }

  .item {
    display: flex; align-items: flex-start; gap: 14px;
    width: calc(100% - 16px); margin: 4px 8px; padding: 12px;
    background: transparent; border: none; cursor: pointer;
    border-radius: 12px; font-size: 15px; color: var(--text);
    text-align: left;
  }
  .item:hover { background: var(--hover); }

  .prompt-graphic {
    display: flex; align-items: center; justify-content: center;
    min-width: 32px; height: 32px; border-radius: 8px;
    background: var(--prompt-icon-bg); 
    flex-shrink: 0;
  }
  .prompt-graphic svg { width: 18px; height: 18px; fill: var(--icon-tint); }

  .item span {
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; 
    overflow: hidden; line-height: 1.4;
  }

  .loading { animation: spin 1s linear infinite; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

const SVG_ICONS = {
  list: `<svg viewBox="0 0 24 24"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>`,
  sync: `<svg viewBox="0 0 24 24"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>`,
  close: `<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`,
  search: `<svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zM9.5 14C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>`
};

let shadow, host;

function scanPrompts() {
  if (!shadow) return;
  const config = getCurrentConfig();
  if (!config) return;

  const listContainer = shadow.querySelector(".sidebar-list");
  const searchTerm = (shadow.querySelector(".search-input").value || "").toLowerCase();
  const foundNodes = document.querySelectorAll(config.promptSelector);
  
  const fragment = document.createDocumentFragment();
  let matchCount = 0;

  foundNodes.forEach(node => {
    const text = config.extractText(node);
    if (!text || (searchTerm && !text.toLowerCase().includes(searchTerm))) return;

    matchCount++;
    const btn = document.createElement("button");
    btn.className = "item";
    btn.innerHTML = `<div class="prompt-graphic">${SVG_ICONS.list}</div><span>${text}</span>`;
    btn.onclick = () => node.scrollIntoView({ behavior: "smooth", block: "center" });
    fragment.appendChild(btn);
  });

  listContainer.innerHTML = matchCount > 0 ? "" : `<div style="text-align:center; padding:40px; opacity:0.5;">No matches found</div>`;
  listContainer.appendChild(fragment);
}

// FIXED DEEP REFRESH: Aggressive scroll-to-trigger loading
async function runDeepScan() {
  const config = getCurrentConfig();
  const syncBtn = shadow.getElementById("syncBtn");
  syncBtn.classList.add("loading");

  const scroller = document.querySelector(config.scrollContainer) || window;
  
  // Multiple scroll attempts to wake up the virtual DOM
  for (let i = 0; i < 5; i++) {
    const targetY = (i === 4) ? 0 : 50; // Jiggle the scroll position
    if (scroller === window) window.scrollTo(0, targetY);
    else scroller.scrollTop = targetY;
    
    await new Promise(r => setTimeout(r, 600)); // Delay for site rendering
  }

  // Final scroll to top
  if (scroller === window) window.scrollTo(0, 0);
  else scroller.scrollTop = 0;
  
  await new Promise(r => setTimeout(r, 400));
  scanPrompts();
  syncBtn.classList.remove("loading");
}

function initSidebar() {
  if (document.getElementById("prompt-nav-root")) return;

  host = document.createElement("div");
  host.id = "prompt-nav-root";
  Object.assign(host.style, {
    position: "fixed", top: "0", right: "0", height: "100vh", width: "340px",
    zIndex: "2147483647", transform: "translateX(100%)", transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
  });

  shadow = host.attachShadow({ mode: "open" });
  const styleTag = document.createElement("style");
  styleTag.textContent = styles;

  const container = document.createElement("div");
  container.className = "sidebar-container";
  container.innerHTML = `
    <div class="toolbar">
      <div class="logo-img"></div>
      <div style="display:flex; gap:8px">
        <button class="icon-btn" id="syncBtn" title="Deep Refresh Chat">${SVG_ICONS.sync}</button>
        <button class="icon-btn" id="closeBtn">${SVG_ICONS.close}</button>
      </div>
    </div>
    <div class="search-wrap">
      <div class="search-icon-fixed">${SVG_ICONS.search}</div>
      <input class="search-input" placeholder="Search prompts..." />
    </div>
    <div class="sidebar-list"></div>
  `;

  shadow.appendChild(styleTag);
  shadow.appendChild(container);
  document.body.appendChild(host);

  shadow.getElementById("closeBtn").onclick = toggleSidebar;
  shadow.getElementById("syncBtn").onclick = runDeepScan;
  shadow.querySelector(".search-input").oninput = scanPrompts;
}

function toggleSidebar() {
  const isHidden = host.style.transform === "translateX(100%)";
  host.style.transform = isHidden ? "translateX(0%)" : "translateX(100%)";
  document.documentElement.style.marginRight = isHidden ? "340px" : "0";
}

const observer = new MutationObserver(() => {
  if (host && host.style.transform === "translateX(0%)") scanPrompts();
});
observer.observe(document.body, { childList: true, subtree: true });

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "toggle_sidebar") {
    initSidebar();
    setTimeout(toggleSidebar, 50);
  }
});
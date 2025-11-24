// idea.js

const FAVORITES_KEY = "fitmatch_favorites";

// 顏色背景（讓靈感卡片有色系感）
const colorBG = {
  earth: "#d4b89f",
  mono: "#c4c4c4",
  pastel: "#f9dfe5",
  pink: "#ffb3c6",
  red: "#e26d5a",
  orange: "#ffb84c",
  yellow: "#ffe26a",
  lightgreen: "#b7e4c7",
  darkgreen: "#588157",
  lightblue: "#a0c4ff",
  blue: "#4361ee",
  purple: "#c77dff",
};

// 讀收藏
function loadFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error("載入收藏失敗", e);
    return [];
  }
}

// 存收藏
function saveFavorites(list) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
}

// 新增收藏（避免重複 id）
function addFavorite(item) {
  const list = loadFavorites();
  const exist = list.some((x) => x.id === item.id);
  if (!exist) {
    list.push(item);
    saveFavorites(list);
  }
}

// 簡單 XSS 防護
function escapeHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// 產生靈感卡片 HTML
function createIdeaCardHTML(data) {
  const { id, title, colorLabel, styleLabel, colorKey } = data;

  const bg = colorBG[colorKey] || "#e5e7eb";

  return `
    <article class="idea-card" 
             data-id="${id}"
             data-title="${escapeHTML(title)}"
             data-color="${colorLabel}"
             data-style="${styleLabel}">
      <div class="idea-thumb" style="background-color:${bg};"></div>
      <div class="idea-body">
        <h3 class="idea-title">${escapeHTML(title)}</h3>
        <p class="idea-tags muted small">#${escapeHTML(
          colorLabel
        )}　#${escapeHTML(styleLabel)}</p>
        <button type="button" class="btn secondary btn-fav">
          ★ 收藏
        </button>
      </div>
    </article>
  `;
}

// 綁定圓框點（顏色 / 風格 二擇一）
function setupTagPills() {
  const groups = document.querySelectorAll(".tag-pills");
  groups.forEach((group) => {
    group.addEventListener("click", (e) => {
      const btn = e.target.closest(".tag-pill");
      if (!btn) return;
      const groupName = btn.dataset.group;

      document
        .querySelectorAll(`.tag-pill[data-group="${groupName}"]`)
        .forEach((el) => el.classList.remove("active"));

      btn.classList.add("active");
    });
  });
}

// 取得目前選到的顏色/風格
function getCurrentSelection() {
  const colorBtn = document.querySelector(
    '.tag-pill[data-group="color"].active'
  );
  const styleBtn = document.querySelector(
    '.tag-pill[data-group="style"].active'
  );

  return {
    colorKey: colorBtn?.dataset.key || null,
    colorLabel: colorBtn?.dataset.label || null,
    styleKey: styleBtn?.dataset.key || null,
    styleLabel: styleBtn?.dataset.label || null,
  };
}

function renderIdeas() {
  const grid = document.getElementById("idea-grid");
  const tip = document.getElementById("idea-tip");
  if (!grid) return;

  const { colorKey, colorLabel, styleKey, styleLabel } = getCurrentSelection();

  if (!colorKey || !styleKey) {
    grid.innerHTML = `
      <div class="muted">
        請先在左側選擇一種 <strong>顏色標籤</strong> 與一種 <strong>風格標籤</strong> 再點「產生靈感」。
      </div>
    `;
    tip.textContent = "";
    return;
  }

  const ideas = [];
  const count = 3;

  for (let i = 1; i <= count; i++) {
    ideas.push({
      id: `${colorKey}-${styleKey}-${Date.now()}-${i}`,
      title: `${colorLabel} × ${styleLabel} 靈感 Look ${i}`,
      colorKey,
      colorLabel,
      styleKey,
      styleLabel,
    });
  }

  grid.innerHTML = ideas.map((x) => createIdeaCardHTML(x)).join("");

  tip.textContent = `已根據「${colorLabel}」與「${styleLabel}」產生 ${count} 個靈感格子，你可以先試玩收藏功能。`;
}

function setupGenerateButton() {
  const btn = document.getElementById("generate-ideas");
  if (!btn) return;
  btn.addEventListener("click", renderIdeas);
}

// 收藏按鈕事件
function setupFavoriteButtons() {
  const grid = document.getElementById("idea-grid");
  if (!grid) return;

  grid.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-fav");
    if (!btn) return;

    const card = e.target.closest(".idea-card");
    if (!card) return;

    const id = card.dataset.id;
    const title = card.dataset.title;
    const color = card.dataset.color;
    const style = card.dataset.style;

    const note = `${color} · ${style} 靈感`;
    const favItem = {
      id,
      title,
      style,
      color,
      note,
      image: null,
    };

    addFavorite(favItem);
    btn.textContent = "已收藏";
    btn.disabled = true;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupTagPills();
  setupGenerateButton();
  setupFavoriteButtons();

  const grid = document.getElementById("idea-grid");
  if (grid) {
    grid.innerHTML = `
      <div class="muted">
        尚未產生任何靈感。請在左側選擇顏色與風格，然後點「產生靈感」。
      </div>
    `;
  }
});

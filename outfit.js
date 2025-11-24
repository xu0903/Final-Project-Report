const FAVORITES_KEY = "fitmatch_favorites";
const RESULT_KEY = "fitmatch_result";

// 顏色背景（給靈感卡片顏色感）
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

/* --------------------------------------------
   收藏相關
--------------------------------------------- */
function loadFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error("收藏載入失敗", e);
    return [];
  }
}

function saveFavorites(list) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
}

function addFavorite(item) {
  const list = loadFavorites();
  const exist = list.some((x) => x.id === item.id);
  if (!exist) {
    list.push(item);
    saveFavorites(list);
  }
}

/* --------------------------------------------
   基本工具
--------------------------------------------- */
function escapeHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* --------------------------------------------
   建立靈感卡片
--------------------------------------------- */
function createIdeaCardHTML(data) {
  const { id, title, colorLabel, styleLabel, colorKey, styleKey } = data;

  const bg = colorBG[colorKey] || "#e5e7eb";

  return `
    <article class="idea-card"
             data-id="${escapeHTML(id)}"
             data-title="${escapeHTML(title)}"
             data-color="${escapeHTML(colorLabel)}"
             data-style="${escapeHTML(styleLabel)}"
             data-colorkey="${escapeHTML(colorKey)}"
             data-stylekey="${escapeHTML(styleKey)}">

      <div class="idea-thumb" style="background-color:${bg};"></div>

      <div class="idea-body">
        <h3 class="idea-title">${escapeHTML(title)}</h3>

        <p class="idea-tags muted small">
          #${escapeHTML(colorLabel)}　#${escapeHTML(styleLabel)}
        </p>

        <button type="button" class="btn secondary btn-fav">
          ★ 收藏
        </button>
      </div>
    </article>
  `;
}

/* --------------------------------------------
   標籤（圓框點）二擇一
--------------------------------------------- */
function setupTagPills() {
  const groups = document.querySelectorAll(".tag-pills");

  groups.forEach((group) => {
    group.addEventListener("click", (e) => {
      const btn = e.target.closest(".tag-pill");
      if (!btn) return;

      const groupName = btn.dataset.group;

      // 同 group 清除 active
      group
        .querySelectorAll(`.tag-pill[data-group="${groupName}"]`)
        .forEach((el) => el.classList.remove("active"));

      // 選取的那顆加 active
      btn.classList.add("active");
    });
  });
}

/* --------------------------------------------
   取得目前的顏色 / 風格選擇
--------------------------------------------- */
function getCurrentSelection() {
  const colorBtn = document.querySelector('.tag-pill[data-group="color"].active');
  const styleBtn = document.querySelector('.tag-pill[data-group="style"].active');

  return {
    colorKey: colorBtn?.dataset.key || null,
    colorLabel: colorBtn?.dataset.label || null,
    styleKey: styleBtn?.dataset.key || null,
    styleLabel: styleBtn?.dataset.label || null,
  };
}

/* --------------------------------------------
   按鈕：產生靈感卡片
--------------------------------------------- */
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

  tip.textContent = `已根據「${colorLabel}」與「${styleLabel}」產生 ${count} 個靈感格子！`;

  // 存起這次產生的結果
  localStorage.setItem("fitmatch_lastIdeas", JSON.stringify({
    colorKey,
    styleKey,
    colorLabel,
    styleLabel,
    ideas
  }));

}

/* --------------------------------------------
   收藏按鈕功能（事件委派）
--------------------------------------------- */
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

/* --------------------------------------------
   ⭐ 卡片點擊 → 加 active 動畫 + 跳轉 gallery.html
--------------------------------------------- */
function setupCardClickJump() {
  const grid = document.getElementById("idea-grid");
  if (!grid) return;

  grid.addEventListener("click", (e) => {
    // 如果點到收藏按鈕，則不要觸發卡片跳轉
    if (e.target.closest(".btn-fav")) return;

    const card = e.target.closest(".idea-card");
    if (!card) return;

    // 先移除其他 active，保持只亮一張
    document.querySelectorAll(".idea-card.active")
      .forEach((c) => c.classList.remove("active"));

    // 加 active 動畫（微上移 + 高光框）
    card.classList.add("active");

    // 取卡片資料
    const id = card.dataset.id;
    const title = card.dataset.title;
    const color = card.dataset.color;
    const style = card.dataset.style;
    const colorKey = card.dataset.colorkey;
    const styleKey = card.dataset.stylekey;

    // 儲存到結果頁
    const result = {
      id,
      title,
      color,
      style,
      colorKey,
      styleKey,
      note: `${color} × ${style} Look`,
    };

    localStorage.setItem("fitmatch_result", JSON.stringify(result));

    // 0.15 秒後跳轉（讓動畫看起來更順）
    setTimeout(() => {
      window.location.href = "gallery.html";
    }, 150);
  });
}


document.addEventListener("DOMContentLoaded", () => {
  setupTagPills();
  setupGenerateButton();
  setupFavoriteButtons();
  setupCardClickJump();
  setupRegenerateButton();

  const nav = performance.getEntriesByType("navigation")[0];
  const isBack = nav && nav.type === "back_forward";   // ←瀏覽器返回
  const isReload = nav && nav.type === "reload";        // ←重新整理

  const grid = document.getElementById("idea-grid");

  // 如果是重新整理 → 清空 lastIdeas
  if (isReload) {
    localStorage.removeItem("fitmatch_lastIdeas");
  }

  // 如果是瀏覽器「返回」→ 恢復卡片
  const last = localStorage.getItem("fitmatch_lastIdeas");

  if (isBack && last) {
    const data = JSON.parse(last);

    grid.innerHTML = data.ideas.map(x => createIdeaCardHTML(x)).join("");

    setupFavoriteButtons();
    setupCardClickJump();

    const colorBtn = document.querySelector(`.tag-pill[data-key="${data.colorKey}"]`);
    const styleBtn = document.querySelector(`.tag-pill[data-key="${data.styleKey}"]`);

    if (colorBtn) colorBtn.classList.add("active");
    if (styleBtn) styleBtn.classList.add("active");

    const tip = document.getElementById("idea-tip");
    tip.textContent = `已恢復先前產生的靈感：${data.colorLabel} × ${data.styleLabel}`;

  } else {
    // 非返回（包含重新整理）→ 顯示預設空畫面
    grid.innerHTML = `
      <div class="muted">
        尚未產生任何靈感。請在左側選擇顏色與風格，然後點「產生靈感」。
      </div>
    `;
  }
});



/* --------------------------------------------
   產生靈感按鈕
--------------------------------------------- */
function setupGenerateButton() {
  const btn = document.getElementById("generate-ideas");
  if (!btn) return;
  btn.addEventListener("click", renderIdeas);
}

function setupRegenerateButton() {
  const btn = document.getElementById("regenerate");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const { colorKey, colorLabel, styleKey, styleLabel } = getCurrentSelection();

    if (!colorKey || !styleKey) {
      alert("請先選擇顏色與風格！");
      return;
    }

    const grid = document.getElementById("idea-grid");
    const tip = document.getElementById("idea-tip");

    const ideas = [];
    const count = 3;

    // 重新生成（使用原本顏色風格）
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

    grid.innerHTML = ideas.map(x => createIdeaCardHTML(x)).join("");

    // 更新提示文字
    tip.textContent = `已重新為你產生新的靈感：${colorLabel} × ${styleLabel}`;

    // 更新 localStorage（覆蓋舊資料）
    localStorage.setItem("fitmatch_lastIdeas", JSON.stringify({
      colorKey,
      styleKey,
      colorLabel,
      styleLabel,
      ideas
    }));

    // 重新綁定收藏與點擊事件
    setupFavoriteButtons();
    setupCardClickJump();
  });
}


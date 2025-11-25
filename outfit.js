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
   建立靈感卡片（無性別色塊）
--------------------------------------------- */
function createIdeaCardHTML(data) {
  const { id, title, colorLabel, styleLabel, genderLabel,
          colorKey, styleKey, genderKey } = data;

  const bg = colorBG[colorKey] || "#e5e7eb";

  return `
    <article class="idea-card"
       data-id="${escapeHTML(id)}"
       data-title="${escapeHTML(title)}"
       data-color="${escapeHTML(colorLabel)}"
       data-style="${escapeHTML(styleLabel)}"
       data-gender="${escapeHTML(genderLabel)}"
       data-colorkey="${escapeHTML(colorKey)}"
       data-stylekey="${escapeHTML(styleKey)}"
       data-genderkey="${escapeHTML(genderKey)}">

      <div class="idea-thumb" style="background-color:${bg};"></div>

      <div class="idea-body">
        <h3 class="idea-title">${escapeHTML(title)}</h3>

        <p class="idea-tags muted small">
          #${escapeHTML(colorLabel)}
          #${escapeHTML(styleLabel)}
          #${escapeHTML(genderLabel)}
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

      group.querySelectorAll(`.tag-pill[data-group="${groupName}"]`)
        .forEach((el) => el.classList.remove("active"));

      btn.classList.add("active");
    });
  });
}

/* --------------------------------------------
   取得目前選擇：顏色 / 風格 / 性別
--------------------------------------------- */
function getCurrentSelection() {
  const colorBtn = document.querySelector('.tag-pill[data-group="color"].active');
  const styleBtn = document.querySelector('.tag-pill[data-group="style"].active');
  const genderBtn = document.querySelector('.tag-pill[data-group="gender"].active');

  return {
    colorKey: colorBtn?.dataset.key || null,
    colorLabel: colorBtn?.dataset.label || null,

    styleKey: styleBtn?.dataset.key || null,
    styleLabel: styleBtn?.dataset.label || null,

    genderKey: genderBtn?.dataset.key || null,
    genderLabel: genderBtn?.dataset.label || null
  };
}

/* --------------------------------------------
   按鈕：產生靈感卡片（含性別）
--------------------------------------------- */
function renderIdeas() {
  const grid = document.getElementById("idea-grid");
  const tip = document.getElementById("idea-tip");
  if (!grid) return;

  const { colorKey, colorLabel, styleKey, styleLabel, genderKey, genderLabel }
    = getCurrentSelection();

  if (!colorKey || !styleKey || !genderKey) {
    grid.innerHTML = `
      <div class="muted">
        請先在左側選擇 <strong>性別</strong>、<strong>顏色</strong>、<strong>風格</strong> 再點「產生靈感」。
      </div>
    `;
    tip.textContent = "";
    return;
  }

  const ideas = [];
  const count = 3;

  for (let i = 1; i <= count; i++) {
    ideas.push({
      id: `${colorKey}-${styleKey}-${genderKey}-${Date.now()}-${i}`,
      title: `${colorLabel} × ${styleLabel} × ${genderLabel} Look ${i}`,
      colorKey,
      colorLabel,
      styleKey,
      styleLabel,
      genderKey,
      genderLabel,
    });
  }

  grid.innerHTML = ideas.map((x) => createIdeaCardHTML(x)).join("");

  setupFavoriteButtons();
  setupCardClickJump();

  tip.textContent =
    `已根據「${colorLabel} × ${styleLabel} × ${genderLabel}」產生 ${count} 個靈感格子！`;

  localStorage.setItem("fitmatch_lastIdeas", JSON.stringify({
    colorKey,
    styleKey,
    genderKey,
    colorLabel,
    styleLabel,
    genderLabel,
    ideas
  }));
}

/* --------------------------------------------
   收藏按鈕功能
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
   ⭐ 卡片點擊 → 跳轉 gallery.html
--------------------------------------------- */
function setupCardClickJump() {
  const grid = document.getElementById("idea-grid");
  if (!grid) return;

  grid.addEventListener("click", (e) => {
    if (e.target.closest(".btn-fav")) return;

    const card = e.target.closest(".idea-card");
    if (!card) return;

    document.querySelectorAll(".idea-card.active")
      .forEach((c) => c.classList.remove("active"));

    card.classList.add("active");

    const id = card.dataset.id;
    const title = card.dataset.title;
    const color = card.dataset.color;
    const style = card.dataset.style;
    const colorKey = card.dataset.colorkey;
    const styleKey = card.dataset.stylekey;

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

    setTimeout(() => {
      window.location.href = "gallery.html";
    }, 150);
  });
}

/* --------------------------------------------
   DOMContentLoaded
--------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  setupTagPills();
  setupGenerateButton();
  setupFavoriteButtons();
  setupCardClickJump();
  setupRegenerateButton();

  const nav = performance.getEntriesByType("navigation")[0];
  const isBack = nav && nav.type === "back_forward";
  const isReload = nav && nav.type === "reload";

  const grid = document.getElementById("idea-grid");

  if (isReload) {
    localStorage.removeItem("fitmatch_lastIdeas");
  }

  const last = localStorage.getItem("fitmatch_lastIdeas");

  if (isBack && last) {
    const data = JSON.parse(last);

    grid.innerHTML = data.ideas.map(x => createIdeaCardHTML(x)).join("");

    setupFavoriteButtons();
    setupCardClickJump();

    const colorBtn = document.querySelector(`.tag-pill[data-key="${data.colorKey}"]`);
    const styleBtn = document.querySelector(`.tag-pill[data-key="${data.styleKey}"]`);
    const genderBtn = document.querySelector(`.tag-pill[data-key="${data.genderKey}"]`);

    if (colorBtn) colorBtn.classList.add("active");
    if (styleBtn) styleBtn.classList.add("active");
    if (genderBtn) genderBtn.classList.add("active");

    const tip = document.getElementById("idea-tip");
    tip.textContent =
      `已恢復先前產生的靈感：${data.colorLabel} × ${data.styleLabel} × ${data.genderLabel}`;

  } else {
    grid.innerHTML = `
      <div class="muted">
        尚未產生任何靈感。請在左側選擇顏色與風格，然後點「產生靈感」。
      </div>
    `;
  }
});

/* --------------------------------------------
   setupGenerateButton
--------------------------------------------- */
function setupGenerateButton() {
  const btn = document.getElementById("generate-ideas");
  if (!btn) return;
  btn.addEventListener("click", renderIdeas);
}

/* --------------------------------------------
   重新生成（加入性別）
--------------------------------------------- */
function setupRegenerateButton() {
  const btn = document.getElementById("regenerate");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const { colorKey, colorLabel, styleKey, styleLabel, genderKey, genderLabel }
      = getCurrentSelection();

    if (!colorKey || !styleKey || !genderKey) {
      alert("請先選擇顏色、風格與性別！");
      return;
    }

    const grid = document.getElementById("idea-grid");
    const tip = document.getElementById("idea-tip");

    const ideas = [];
    const count = 3;

    for (let i = 1; i <= count; i++) {
      ideas.push({
        id: `${colorKey}-${styleKey}-${genderKey}-${Date.now()}-${i}`,
        title: `${colorLabel} × ${styleLabel} × ${genderLabel} Look ${i}`,
        colorKey,
        colorLabel,
        styleKey,
        styleLabel,
        genderKey,
        genderLabel
      });
    }

    grid.innerHTML = ideas.map(x => createIdeaCardHTML(x)).join("");

    tip.textContent =
      `已重新為你產生新的靈感：${colorLabel} × ${styleLabel} × ${genderLabel}`;

    localStorage.setItem("fitmatch_lastIdeas", JSON.stringify({
      colorKey,
      styleKey,
      genderKey,
      colorLabel,
      styleLabel,
      genderLabel,
      ideas
    }));

    setupFavoriteButtons();
    setupCardClickJump();
  });
}
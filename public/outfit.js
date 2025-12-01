/* --------------------------------------------
   由mySQL的tags table動態生成靈感標籤
--------------------------------------------- */

// 渲染標籤群組
function renderTagsByType(tags) {
  const genderContainer = document.getElementById("gender-tags");
  const colorContainer = document.getElementById("color-tags");
  const styleContainer = document.getElementById("style-tags");

  // 清空原本寫死在 HTML 的 button
  genderContainer.innerHTML = "";
  colorContainer.innerHTML = "";
  styleContainer.innerHTML = "";

  tags.forEach(tag => {
    // 建立按鈕
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tag-pill";
    btn.dataset.group = tag.type;
    btn.dataset.key = tag.key;
    btn.dataset.label = tag.label;

    btn.innerHTML = `<span class="dot"></span> ${tag.label}`;

    // 依 type 渲染到不同區塊
    if (tag.type === "gender") genderContainer.appendChild(btn);
    if (tag.type === "color") colorContainer.appendChild(btn);
    if (tag.type === "style") styleContainer.appendChild(btn);
  });
}



async function fetchAndRenderTags() {
  try {
    const response = await fetch('/get-all-tags');
    if (!response.ok) {
      throw new Error('無法取得標籤資料');
    }
    const tags = await response.json();
    //console.log("取得的標籤資料：", tags);

    renderTagsByType(tags);
  } catch (error) {
    console.error("取得標籤失敗：", error);
  }
}

fetchAndRenderTags();

/* --------------------------------------------
   紀錄功能 (History / Preference)
--------------------------------------------- */
const HISTORY_KEY = "fitmatch_history";

function loadHistory() {
  const raw = localStorage.getItem(HISTORY_KEY);
  return raw ? JSON.parse(raw) : [];
}

function recordPreference(data) {
  const list = loadHistory();

  // 建立一筆新的紀錄
  const newRecord = {
    timestamp: new Date().toISOString(), // 紀錄時間
    gender: data.genderLabel,
    color: data.colorLabel,
    style: data.styleLabel,
    // 保留 key 方便之後資料庫分析
    genderKey: data.genderKey,
    colorKey: data.colorKey,
    styleKey: data.styleKey
  };

  // 為了避免紀錄太長，限制只留最近 50 筆
  if (list.length > 50) {
    list.shift(); // 移除最舊的
  }

  list.push(newRecord);

  // 存入 LocalStorage
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list));

  // 在 Console 顯示紀錄結果 (開發用)
  console.log("已新增一筆風格紀錄：", newRecord);
  console.table(list);
}

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

function saveFavorites(outfitID) {
  fetch('/save-favorite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ outfitID })
  })
    .then(res => res.json())
    .then(data => {
      if (!data.success) {
        console.error("儲存收藏到伺服器失敗：", data.message);
      }
    })
    .catch(error => {
      console.error("儲存收藏到伺服器時發生錯誤：", error);
    });
}

function deleteFavorite(outfitID) {
  console.log("Deleting favorite outfitID:", outfitID);
  fetch('/delete-favorite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ outfitID })
  })
    .then(res => res.json())
    .then(data => {
      if (!data.success) {
        console.error("刪除收藏到伺服器失敗：", data.message);
      }
    })
    .catch(error => {
      console.error("刪除收藏到伺服器時發生錯誤：", error);
    });
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
  console.log("createIdeaCardHTML data:", data);

  const bg = colorBG[colorKey] || "#e5e7eb";

  // 1. 讀取目前的收藏清單
  const currentFavorites = loadFavorites();
  // 2. 檢查這張卡片是否已在清單中
  const isFav = currentFavorites.some(item => item.id == id);

  // 3. 根據狀態決定按鈕文字與樣式
  const btnText = isFav ? "★ 已收藏" : "★ 收藏";
  const btnClass = isFav ? "btn secondary btn-fav saved" : "btn secondary btn-fav";

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

        <button type="button" class="${btnClass}">
          ${btnText}
        </button>
      </div>

    </article>
  `;
}

/* --------------------------------------------
   "已選取" 按鈕css樣式切換
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
let currentOutfit = [];
async function renderIdeas() {
  const grid = document.getElementById("idea-grid");
  const tip = document.getElementById("idea-tip");
  const regenBtn = document.getElementById("regenerate");

  if (!grid) return;

  const selection = getCurrentSelection();
  const { colorKey, colorLabel, styleKey, styleLabel, genderKey, genderLabel } = selection;

  if (!colorKey || !styleKey || !genderKey) {
    grid.innerHTML = `<div class="muted">請先選擇性別、顏色、風格再點「產生靈感」。</div>`;
    if (tip) tip.textContent = "";
    if (regenBtn) regenBtn.style.display = "none";
    return;
  }

  recordPreference(selection);

  const ideas = [];
  const savedOutfitIDs = []; // ✅ 初始化
  const count = 3;

  for (let i = 1; i <= count; i++) {
    // 1. 先呼叫後端存入 outfits table
    const res = await fetch('/save-outfit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        genderKey, genderLabel, styleKey, styleLabel, colorKey, colorLabel,
        title: `${colorLabel} × ${styleLabel} × ${genderLabel} Look ${i}`,
        description: null,
        imageURL: null
      })
    });
    currentOutfit[i - 1] = await res.json();

    console.log("儲存 outfit 回傳結果之1：", currentOutfit[i - 1]);

    if (!currentOutfit[i - 1].success) {
      console.error("儲存 outfit 失敗：", currentOutfit[i - 1].message);
      continue;
    }

    savedOutfitIDs.push(currentOutfit[i - 1].outfitID);
    ideas.push({
      id: currentOutfit[i - 1].outfitID, // 使用後端的 ID
      title: `${colorLabel} × ${styleLabel} × ${genderLabel} Look ${i}`,
      colorKey,
      colorLabel,
      styleKey,
      styleLabel,
      genderKey,
      genderLabel,
    });
  }
  console.log("已儲存的 outfit IDs：", ideas.map(x => x.id));

  grid.innerHTML = ideas.map(x => createIdeaCardHTML(x)).join("");

  if (regenBtn) regenBtn.style.display = "inline-block";
  tip.textContent = `已根據「${colorLabel} × ${styleLabel} × ${genderLabel}」產生 ${count} 個靈感格子！`;

  localStorage.setItem("fitmatch_lastIdeas", JSON.stringify({
    colorKey, styleKey, genderKey,
    colorLabel, styleLabel, genderLabel,
    ideas
  }));
}


/* --------------------------------------------
   收藏按鈕功能
--------------------------------------------- */
function setupFavoriteButtons() {
  const grid = document.getElementById("idea-grid");
  if (!grid) return;

  grid.addEventListener("click", async (e) => {
    const btn = e.target.closest(".btn-fav");
    if (!btn) return;

    const card = btn.closest(".idea-card");
    if (!card) return;

    const outfitID = card.dataset.id;
    const cardData = {
      title: card.dataset.title,
      style: card.dataset.style,
      color: card.dataset.color,
      note: `${card.dataset.color} · ${card.dataset.style} 靈感`,
    };

    await toggleFavorite(btn, outfitID, cardData);
  });
}


async function toggleFavorite(btn, outfitID, cardData) {
  try {
    // 驗證登入狀態 + 是否已收藏
    const checkRes = await fetch(`/check-favorite?outfitID=${encodeURIComponent(outfitID)}`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });

    if (checkRes.status === 401) {
      alert("請先登入才能使用收藏功能！");
      return;
    }

    const checkData = await checkRes.json();

    // 取消收藏
    if (checkData.isFavorite) {
      const delRes = await fetch('/delete-favorite', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outfitID })
      });

      if (delRes.status === 401) {
        alert("請先登入！");
        return;
      }

      btn.textContent = "★ 收藏";
      btn.classList.remove("saved");
      return;
    }

    // 新增收藏
    const saveRes = await fetch('/save-favorite', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outfitID })
    });

    if (saveRes.status === 401) {
      alert("請先登入！");
      return;
    }

    btn.textContent = "★ 已收藏";
    btn.classList.add("saved");

  } catch (error) {
    console.error("收藏操作失敗", error);
  }
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
      id, title, color, style, colorKey, styleKey,
      note: `${color} × ${style} Look`,
    };

    localStorage.setItem("fitmatch_result", JSON.stringify(result));

    setTimeout(() => {
      window.location.href = "gallery.html";
    }, 150);
  });
}

/* --------------------------------------------
   清除按鈕功能 (新功能)
--------------------------------------------- */
function setupClearButton() {
  const btn = document.getElementById("clear-filters");
  if (!btn) return;

  btn.addEventListener("click", () => {
    // 1. 清除所有選中的標籤 (.active)
    document.querySelectorAll(".tag-pill.active")
      .forEach((el) => el.classList.remove("active"));

    // 2. 清除右側格子與提示
    const grid = document.getElementById("idea-grid");
    const tip = document.getElementById("idea-tip");
    const regenBtn = document.getElementById("regenerate");

    if (grid) {
      grid.innerHTML = `
        <div class="muted">
          尚未產生任何靈感。請在左側選擇顏色與風格，然後點「產生靈感」。
        </div>
      `;
    }
    if (tip) tip.textContent = "";

    // 3. 隱藏重新生成按鈕
    if (regenBtn) regenBtn.style.display = "none";

    // 4. 清除 localStorage 暫存 (只清除當前狀態，保留歷史紀錄與收藏)
    localStorage.removeItem("fitmatch_lastIdeas");
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
  setupClearButton(); // ★ 啟用清除按鈕功能

  const grid = document.getElementById("idea-grid");
  const regenBtn = document.getElementById("regenerate");

  // 嘗試讀取上一次的狀態
  const last = localStorage.getItem("fitmatch_lastIdeas");

  // 只要有資料就載入
  if (last) {
    const data = JSON.parse(last);

    grid.innerHTML = data.ideas.map(x => createIdeaCardHTML(x)).join("");

    const colorBtn = document.querySelector(`.tag-pill[data-key="${data.colorKey}"]`);
    const styleBtn = document.querySelector(`.tag-pill[data-key="${data.styleKey}"]`);
    const genderBtn = document.querySelector(`.tag-pill[data-key="${data.genderKey}"]`);

    if (colorBtn) colorBtn.classList.add("active");
    if (styleBtn) styleBtn.classList.add("active");
    if (genderBtn) genderBtn.classList.add("active");

    const tip = document.getElementById("idea-tip");
    if (tip) {
      tip.textContent = `已恢復先前產生的靈感：${data.colorLabel} × ${data.styleLabel} × ${data.genderLabel}`;
    }

    if (regenBtn) regenBtn.style.display = "inline-block";

  } else {
    grid.innerHTML = `
      <div class="muted">
        尚未產生任何靈感。請在左側選擇顏色與風格，然後點「產生靈感」。
      </div>
    `;
    if (regenBtn) regenBtn.style.display = "none";
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
   重新生成
--------------------------------------------- */
function setupRegenerateButton() {
  const btn = document.getElementById("regenerate");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const selection = getCurrentSelection();
    const { colorKey, colorLabel, styleKey, styleLabel, genderKey, genderLabel } = selection;

    if (!colorKey || !styleKey || !genderKey) {
      alert("請先選擇顏色、風格與性別！");
      return;
    }

    recordPreference(selection);

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
      colorKey, styleKey, genderKey,
      colorLabel, styleLabel, genderLabel,
      ideas
    }));
  });
}
/* --------------------------------------------
   由mySQL的tags table動態生成靈感標籤
--------------------------------------------- */

// --------------------------------------------
// 生成穿搭需要用到的設定（要放在 outfit.js 上方）
// --------------------------------------------

const MAP_STYLE = {
  "formal": "formal",
  "simple": "simple",
  "sweety": "sweety",
  "street": "street"
};

const MAP_COLOR = {
  "mono": "blackgraywhite",
  "blackgraywhite": "blackgraywhite",
  "blue": "blue",
  "lightblue": "blue",
  "brown": "brown",
  "earth": "brown"
};

// --------------------------------------------
// ⭐ 生成整組穿搭（帽子 / 上衣 / 褲子）
// --------------------------------------------

// 渲染標籤群組
function renderTagsByType(tags) {
  const colorContainer = document.getElementById("color-tags");
  const styleContainer = document.getElementById("style-tags");

  // 清空原本寫死在 HTML 的 button
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

fetchAndRenderTags().then(() => {
  restoreTagSelections();
});

/* --------------------------------------------
   由ID取的outfit資料
--------------------------------------------- */
async function fetchOutfit(outfitID) {
  try {
    const res = await fetch(`/get-outfit/${encodeURIComponent(outfitID)}`, {
      method: 'GET',
      credentials: 'include', // 如果需要 Cookie/JWT
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      throw new Error(`伺服器回傳錯誤: ${res.status}`);
    }

    const data = await res.json();

    if (!data.success) {
      console.error("取得 outfit 失敗：", data.message);
      return null;
    }

    return data.outfit; // 回傳 outfit 物件

  } catch (err) {
    console.error("fetchOutfit 錯誤：", err);
    return null;
  }
}


/* --------------------------------------------
   紀錄功能 (History / Preference)
--------------------------------------------- */
async function loadHistory() {
  try {
    const res = await fetch('/get-history', { credentials: 'include' });
    const data = await res.json();

    if (!data.success || !Array.isArray(data.history)) return [];

    console.log("取得歷史紀錄：", data.history);

    // 取最後三筆
    const lastThree = data.history.slice(0, 3);

    // 用 Promise.all 同時 fetch 三筆 outfit 資料
    const outfitPromises = lastThree.map(item => fetchOutfit(item.OutfitID));
    const outfits = await Promise.all(outfitPromises);

    // 將取得的 outfits 過濾掉 null，並轉成 idea 卡片所需格式
    return outfits
      .filter(o => o !== null)
      .map(o => {
        const storedImages = JSON.parse(localStorage.getItem(`fitmatch_look_${o.OutfitID}`));

        return {
          id: o.OutfitID,
          title: o.Title,
          colorKey: o.ColorKey,
          styleKey: o.StyleKey,
          colorLabel: o.ColorLabel || o.ColorKey,
          styleLabel: o.StyleLabel || o.StyleKey,
          outfitImages: storedImages   // ⭐ 補回 outfitImages
        };
      })
      .sort((a, b) => {
        const numA = parseInt(a.title.match(/Look (\d+)/)[1]);
        const numB = parseInt(b.title.match(/Look (\d+)/)[1]);
        return numA - numB;
      });


  } catch (error) {
    console.error("從伺服器取得歷史紀錄失敗：", error);
    return [];
  }
}



async function saveHistory(outfitID) {
  console.log("Saving history for outfitID:", outfitID);
  fetch('/add-history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ outfitID })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        console.log("已將歷史紀錄儲存到伺服器");
      } else {
        console.error("儲存歷史紀錄到伺服器失敗：", data.message);
      }
    })
    .catch(error => {
      console.error("儲存歷史紀錄到伺服器時發生錯誤：", error);
    });
}

// 顏色背景（給靈感卡片顏色感）
const colorBG = {
  blackgraywhite: "#a2a1a1ff",
  blue: "#b7d7fcff",
  brown: "#c7ac91ff",
};

/* --------------------------------------------
   收藏相關
--------------------------------------------- */
async function loadFavorites() {
  try {
    const res = await fetch('/get-user-favorites', {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    return data.favorites;
  } catch (e) {
    console.error("收藏載入失敗", e);
  }
}

async function saveFavorites(outfitID) {
  try {
    const res = await fetch('/save-favorite', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outfitID })
    });
    const data = await res.json();
    if (!data.success) console.error("儲存收藏失敗：", data.message);
    return data;
  } catch (error) {
    console.error("儲存收藏出錯：", error);
    return { success: false, error };
  }
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
   建立靈感卡片
--------------------------------------------- */
async function createIdeaCardHTML(data, favorites = []) {
  const { id, title, colorLabel, styleLabel,
    colorKey, styleKey } = data;
  console.log("createIdeaCardHTML data:", data);

  const bg = colorBG[colorKey] || "#e5e7eb";

  console.log('favorites:', favorites);
  // 判斷是否已收藏
  const isFav = favorites.some(item => item.OutfitID == id);
  console.log('isFav for outfitID', id, ':', isFav);

  // 根據狀態決定按鈕文字與樣式
  const btnText = isFav ? "★ 已收藏" : "★ 收藏";
  const btnClass = isFav ? "btn secondary btn-fav saved" : "btn secondary btn-fav";

  return `
    <article class="idea-card"
      data-id="${escapeHTML(id)}"
      data-title="${escapeHTML(title)}"
      data-color="${escapeHTML(colorLabel)}"
      data-style="${escapeHTML(styleLabel)}"
      data-colorkey="${escapeHTML(colorKey)}"
      data-stylekey="${escapeHTML(styleKey)}"
      data-images='${escapeHTML(JSON.stringify(data.outfitImages || {}))}'>

      <div class="idea-thumb" style="background-color:${bg};"></div>

      <div class="idea-body">
        <h3 class="idea-title">${escapeHTML(title)}</h3>

        <p class="idea-tags muted small">
          #${escapeHTML(colorLabel)}
          #${escapeHTML(styleLabel)}
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
      // ⭐ 儲存目前選取到 localStorage
      localStorage.setItem(`fitmatch_${groupName}_selected`, btn.dataset.key);

    });
  });
}

function restoreTagSelections() {
  const savedColor = localStorage.getItem("fitmatch_color_selected");
  const savedStyle = localStorage.getItem("fitmatch_style_selected");

  // 恢復顏色選擇
  if (savedColor) {
    const colorBtn = document.querySelector(`.tag-pill[data-group="color"][data-key="${savedColor}"]`);
    if (colorBtn) colorBtn.classList.add("active");
  }

  // 恢復風格選擇
  if (savedStyle) {
    const styleBtn = document.querySelector(`.tag-pill[data-group="style"][data-key="${savedStyle}"]`);
    if (styleBtn) styleBtn.classList.add("active");
  }
}


/* --------------------------------------------
   取得目前選擇：顏色 / 風格 / 性別
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
  隨機選取outfit圖片連結
---------------------------------------------*/
let CLOTHING_DATA = null;
loadClothingJSON();
// 載入 clothingData.json（一定要有）
async function loadClothingJSON() {
  const res = await fetch("clothingData.json");
  const JsonData = await res.json();
  console.log("clothingData.json 載入狀態：", JsonData);
  CLOTHING_DATA = JsonData;
}

// 隨機挑一張照片
function pickRandom(style, category, color) {
  const s = (MAP_STYLE[style] ?? style).toLowerCase();
  const c = (MAP_COLOR[color] ?? color).toLowerCase();

  const list = CLOTHING_DATA?.[s]?.[category]?.[c];
  if (!list || list.length === 0) return null;

  return list[Math.floor(Math.random() * list.length)];
}

// 生成整套穿搭
function generateOutfit(style, color) {
  console.log('generateOutfit函式');
  const hat = pickRandom(style, "hat", color);
  const top = pickRandom(style, "top", color);
  const bottom = pickRandom(style, "bottom", color);
  console.log("生成穿搭連結：", hat, top, bottom);
  return {
    hat: hat,
    top: top,
    bottom: bottom
  };
}

/* --------------------------------------------
   按鈕：產生靈感卡片
--------------------------------------------- */
async function renderIdeas() {
  const grid = document.getElementById("idea-grid");
  const tip = document.getElementById("idea-tip");
  const regenBtn = document.getElementById("regenerate");

  if (!grid) return;

  const selection = getCurrentSelection();
  const { colorKey, colorLabel, styleKey, styleLabel } = selection;

  if (!colorKey || !styleKey) {
    grid.innerHTML = `<div class="muted">請先選擇顏色、風格再點「產生靈感」。</div>`;
    if (tip) tip.textContent = "";
    if (regenBtn) regenBtn.style.display = "none";
    return;
  }


  const ideas = [];
  const count = 3;

  for (let i = 1; i <= count; i++) {
    //隨機生成圖片
    const outfitImages = generateOutfit(styleKey, colorKey);
    const { hat, top, bottom } = outfitImages;
    console.log('outfitImages : ', outfitImages);
    console.log('hat top bottom : ', hat, top, bottom);
    // 1. 先呼叫後端存入 outfits table
    const res = await fetch('/save-outfit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        styleKey, styleLabel, colorKey, colorLabel,
        title: `${colorLabel} × ${styleLabel} Look ${i}`,
        description: `${colorLabel} × ${styleLabel}`,
        ImageHat: hat,
        ImageTop: top,
        ImageBottom: bottom
      })
    });

    const data = await res.json();
    console.log("儲存 outfit 回傳資料：", data.outfitID);
    await saveHistory(data.outfitID); // 儲存歷史紀錄

    // 把這組 Look 存進 localStorage（用 outfitID 當 key）
    localStorage.setItem(`fitmatch_look_${data.outfitID}`, JSON.stringify(outfitImages));

    ideas.push({
      id: data.outfitID,
      title: `${colorLabel} × ${styleLabel} Look ${i}`,
      colorKey,
      colorLabel,
      styleKey,
      styleLabel,
      outfitImages   // ← 直接放在卡片資料裡
    });

  }
  console.log("已儲存的 outfit IDs：", ideas.map(x => x.id));

  const favorites = await loadFavorites();
  grid.innerHTML = (await Promise.all(ideas.map(x => createIdeaCardHTML(x, favorites)))).join("");

  if (regenBtn) regenBtn.style.display = "inline-block";
  tip.textContent = `已根據「${colorLabel} × ${styleLabel}」產生 ${count} 個靈感格子！`;
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
    const saveRes = await saveFavorites(outfitID);
    console.log("Save favorite response:", saveRes);

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
    // 點到收藏按鈕就不要跳轉
    if (e.target.closest(".btn-fav")) return;

    const card = e.target.closest(".idea-card");
    if (!card) return;

    // 視覺效果
    document.querySelectorAll(".idea-card.active")
      .forEach((c) => c.classList.remove("active"));
    card.classList.add("active");

    // 準備新的 result 資料
    const id = card.dataset.id;
    const title = card.dataset.title;
    const color = card.dataset.color;
    const style = card.dataset.style;
    const colorKey = card.dataset.colorkey;
    const styleKey = card.dataset.stylekey;

    const newResult = {
      id,
      title,
      color,
      style,
      colorKey,
      styleKey,
      note: `${color} × ${style} Look`
    };

    // 從卡片讀出固定組合
    const outfitImages =
      JSON.parse(localStorage.getItem(`fitmatch_look_${id}`)) ||
      JSON.parse(card.dataset.images);

    // 存到 result
    newResult.outfitImages = outfitImages;

    // 檢查 localStorage 是否已有舊資料（是否生成過 outfitImages）
    //const oldResult = JSON.parse(localStorage.getItem("fitmatch_outfit_result") || "{}");

    // 若舊 Look 與新的 Look 是同一個 → 保留 outfitImages
    // if (oldResult.id === newResult.id && oldResult.outfitImages) {
    //   newResult.outfitImages = oldResult.outfitImages;
    // }


    // 儲存回 localStorage
    //localStorage.setItem("fitmatch_outfit_result", JSON.stringify(newResult));

    // 跳轉到 gallery;
    setTimeout(() => {
      window.location.href = `gallery.html?outfitID=${id}&from=${'outfit.html'}`;
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
    // 清除所有選中的標籤 (.active)
    document.querySelectorAll(".tag-pill.active")
      .forEach((el) => el.classList.remove("active"));

    // 清除右側格子與提示
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

    // 隱藏重新生成按鈕
    if (regenBtn) regenBtn.style.display = "none";
  });
}

/* --------------------------------------------
   DOMContentLoaded
--------------------------------------------- */
document.addEventListener("DOMContentLoaded", async () => {
  setupTagPills();
  restoreTagSelections();
  setupGenerateButton();
  setupFavoriteButtons();
  setupCardClickJump();
  setupClearButton();

  const grid = document.getElementById("idea-grid");
  const regenBtn = document.getElementById("regenerate");

  // 從後端抓歷史紀錄
  const history = await loadHistory();
  const favorites = await loadFavorites();
  console.log("History loaded:", history);
  console.log("Loaded favorites:", favorites);

  if (history.length > 0) {
    grid.innerHTML = (await Promise.all(history.map(x => createIdeaCardHTML(x, favorites)))).join("");
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
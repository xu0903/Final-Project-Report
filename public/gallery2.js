// gallery2.js — 升級版結果展示頁邏輯

const RESULT_KEY = "fitmatch_result";
const FAVORITES_KEY = "fitmatch_favorites";

// 對照表 (需與 outfit.js 保持一致，將 UI key 轉為 JSON key)
const MAP_STYLE = {
    "eu": "formal",
    "jp": "simple",
    "kr": "sweety",
    "street": "street"
};

const MAP_COLOR = {
    "mono": "blackgraywhite",
    "blue": "blue",
    "lightblue": "blue",
    "earth": "brown",
    "orange": "brown",
    "yellow": "brown"
};

let CLOTHING_DATA = null;
let currentOutfit = { hat: null, top: null, bottom: null }; // 儲存當前隨機生成的這套

// ---------- 載入 JSON 資料 ----------
async function fetchClothingData() {
  try {
    const res = await fetch('clothingData.json');
    if(res.ok) {
        CLOTHING_DATA = await res.json();
    }
  } catch(e) {
    console.error("無法讀取 clothingData.json", e);
  }
}

// ---------- 隨機挑選一張圖片 ----------
function getRandomItem(style, category, color) {
    if (!CLOTHING_DATA) return null;
    
    // 轉換 Key
    const jsonStyle = MAP_STYLE[style] || style;
    const jsonColor = MAP_COLOR[color] || color;

    // 安全檢查
    if (
        CLOTHING_DATA[jsonStyle] && 
        CLOTHING_DATA[jsonStyle][category] && 
        CLOTHING_DATA[jsonStyle][category][jsonColor]
    ) {
        const list = CLOTHING_DATA[jsonStyle][category][jsonColor];
        if (list.length > 0) {
            const idx = Math.floor(Math.random() * list.length);
            return list[idx];
        }
    }
    // 如果找不到該顏色的，嘗試找同風格其他顏色，或回傳 null
    return null; 
}

// ---------- 生成整套穿搭 ----------
function generateFullOutfit(styleKey, colorKey) {
    // 分別抓取三個部位
    const hat = getRandomItem(styleKey, "hat", colorKey);
    const top = getRandomItem(styleKey, "top", colorKey);
    const bottom = getRandomItem(styleKey, "bottom", colorKey);
    
    return { hat, top, bottom };
}

// ---------- 收藏讀寫 ----------
function loadFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
  } catch { return []; }
}

function saveFavorites(list) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
}

// ---------- 主程式 ----------
document.addEventListener("DOMContentLoaded", async () => {
  // 1. 讀取上一頁的篩選結果
  const rawResult = localStorage.getItem(RESULT_KEY);
  if (!rawResult) {
    document.getElementById("look-title").textContent = "無法載入結果，請重新篩選";
    return;
  }
  const resultData = JSON.parse(rawResult);

  // 2. 顯示文字與標籤
  document.getElementById("look-title").textContent = resultData.title;
  document.getElementById("look-note").textContent = resultData.note;
  
  const tagBox = document.getElementById("look-tags");
  const tags = [resultData.color, resultData.style];
  // 以前的版本可能沒有 gender，檢查一下
  if(resultData.genderLabel) tags.push(resultData.genderLabel); 
  
  tagBox.innerHTML = tags.map(t => `<span class="badge">${t}</span>`).join("");

  // 3. 等待 JSON 載入
  await fetchClothingData();

  // 4. 生成這一次的穿搭組合 (如果 localStorage 只有一張 top/bottom，我們這裡補齊全身)
  // 為了體驗好，我們直接根據 style/color 重新產生一套
  currentOutfit = generateFullOutfit(resultData.colorKey, resultData.styleKey);

  console.log("生成的穿搭組合:", currentOutfit);

  // 5. 渲染畫面
  renderGallery();
  setupEvents(resultData);
});

function renderGallery() {
    const displayContainer = document.getElementById("look-display-container");
    const thumbGrid = document.getElementById("thumbnails-grid");

    // --- A. 渲染左側大圖 (預設顯示全身堆疊) ---
    renderStackedView(displayContainer);

    // --- B. 渲染右側縮圖牆 (4張) ---
    // 1. 全身縮圖 (用 CSS 模擬堆疊)
    // 2. 帽子
    // 3. 上衣
    // 4. 褲子
    
    const items = [
        { type: 'full',   img: null }, // 特殊處理
        { type: 'hat',    img: currentOutfit.hat },
        { type: 'top',    img: currentOutfit.top },
        { type: 'bottom', img: currentOutfit.bottom }
    ];

    thumbGrid.innerHTML = items.map((item, index) => {
        let content = "";
        
        if (item.type === 'full') {
            // 製作一個迷你的堆疊圖
            content = `
                <div style="display:flex; flex-direction:column; width:100%; height:100%; padding:2px;">
                    ${currentOutfit.hat ? `<img src="${currentOutfit.hat}" style="flex:1; object-fit:contain;">` : ''}
                    ${currentOutfit.top ? `<img src="${currentOutfit.top}" style="flex:1; object-fit:contain;">` : ''}
                    ${currentOutfit.bottom ? `<img src="${currentOutfit.bottom}" style="flex:1; object-fit:contain;">` : ''}
                </div>
            `;
        } else {
            // 單品圖 (若沒圖顯示 placeholder)
            const src = item.img || 'https://placehold.co/100x100?text=No+Image';
            content = `<img src="${src}" alt="${item.type}" />`;
        }

        return `
            <div class="thumb-item ${index === 0 ? 'active-thumb' : ''}" data-index="${index}" data-type="${item.type}">
                ${content}
            </div>
        `;
    }).join("");

    // 綁定縮圖點擊事件
    document.querySelectorAll(".thumb-item").forEach(item => {
        item.addEventListener("click", () => {
            // 切換 active 樣式
            document.querySelectorAll(".thumb-item").forEach(t => t.classList.remove("active-thumb"));
            item.classList.add("active-thumb");

            // 切換左側視圖
            const type = item.dataset.type;
            if (type === 'full') {
                renderStackedView(displayContainer);
            } else {
                const imgSrc = currentOutfit[type];
                renderSingleView(displayContainer, imgSrc);
            }
        });
    });
}

// 渲染左側：堆疊模式 (Hat + Top + Bottom)
function renderStackedView(container) {
    // 加上動畫 class
    container.style.opacity = 0;
    
    setTimeout(() => {
        container.innerHTML = `
            ${currentOutfit.hat ? `<img src="${currentOutfit.hat}" class="look-item-img" style="flex: 0.8;">` : ''}
            ${currentOutfit.top ? `<img src="${currentOutfit.top}" class="look-item-img" style="flex: 1.2;">` : ''}
            ${currentOutfit.bottom ? `<img src="${currentOutfit.bottom}" class="look-item-img" style="flex: 1.2;">` : ''}
        `;
        container.style.opacity = 1;
    }, 150);
}

// 渲染左側：單張大圖模式
function renderSingleView(container, src) {
    container.style.opacity = 0;
    
    setTimeout(() => {
        if (src) {
            container.innerHTML = `<img src="${src}" class="look-single-img">`;
        } else {
            container.innerHTML = `<p class="muted">此部位尚無圖片</p>`;
        }
        container.style.opacity = 1;
    }, 150);
}

function setupEvents(resultData) {
    // 收藏按鈕
    const favBtn = document.getElementById("fav-btn");
    const favList = loadFavorites();
    // 檢查是否收藏 (這裡簡單用 resultData.id 檢查，雖然內容圖片可能變了，但概念上是這個 "Look")
    const isFav = favList.some(x => x.id === resultData.id);

    if (isFav) {
        favBtn.textContent = "★ 已收藏";
        favBtn.classList.add("active-fav");
    }

    favBtn.addEventListener("click", () => {
        const list = loadFavorites();
        const existIdx = list.findIndex(x => x.id === resultData.id);

        if (existIdx !== -1) {
            // 取消收藏
            list.splice(existIdx, 1);
            saveFavorites(list);
            favBtn.textContent = "★ 收藏";
            favBtn.classList.remove("active-fav");
        } else {
            // 加入收藏 (這次我們要存真的圖片路徑!)
            const newItem = {
                ...resultData,
                // 把這一次隨機生成的圖片存進去，之後在 ID.html 才能看到這套
                outfitImages: {
                    hat: currentOutfit.hat,
                    top: currentOutfit.top,
                    bottom: currentOutfit.bottom
                },
                // 為了相容舊版單張圖顯示，選一張主要的當代表圖 (例如 Top)
                image: currentOutfit.top || currentOutfit.hat
            };
            list.push(newItem);
            saveFavorites(list);
            favBtn.textContent = "★ 已收藏";
            favBtn.classList.add("active-fav");
        }
    });

    // 重新搭配 (回到上頁)
    document.getElementById("redo-btn").addEventListener("click", () => {
        window.location.href = "outfit.html";
    });
}
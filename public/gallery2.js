// -------------------------------
//   FitMatch — 固定路徑版 gallery2.js
// -------------------------------

const RESULT_KEY = "fitmatch_result"; // 注意：這裡要跟上一頁存的 key 一樣

/* ⭐ 設定區：請依據你的圖片格式修改這裡 
  注意：網頁上必須使用「相對路徑」，不能用 C:\Users\...
*/
const CONFIG = {
  basePath: "clothing/clothes_set", // 圖片資料夾根目錄
  extensions: ".png",               // 圖片副檔名 (例如 .jpg 或 .png)
  filenames: {
    hat: "hat",       // 帽子檔名 (不用加副檔名)
    top: "top",       // 上衣檔名
    bottom: "bottom"  // 褲子檔名
  }
};

let current = { hat: null, top: null, bottom: null };

// ---------------------------
// 解析路徑 (核心邏輯)
// ---------------------------
function resolvePath(styleId, lookIndex) {
  // 將 1, 2, 3, 4 轉換為資料夾 a, b, c, d
  const setMap = ["a", "b", "c", "d"];
  // 防呆：如果 index 超出範圍，預設回傳 a
  const setFolder = setMap[lookIndex - 1] || "a"; 

  // 組合成完整路徑： clothing/clothes_set/campus/a/
  const dir = `${CONFIG.basePath}/${styleId}/${setFolder}/`;
  const ext = CONFIG.extensions;

  return {
    hat: `${dir}${CONFIG.filenames.hat}${ext}`,
    top: `${dir}${CONFIG.filenames.top}${ext}`,
    bottom: `${dir}${CONFIG.filenames.bottom}${ext}`
  };
}

// ---------------------------
// 渲染左側大圖（拼貼）
// ---------------------------
function renderStacked() {
  const box = document.getElementById("look-image");
  
  // 注意：加入 onerror，如果找不到圖片(例如沒帽子)就自動隱藏
  box.innerHTML = `
    <img src="${current.hat}" class="look-stack-img" onerror="this.style.display='none'">
    <img src="${current.top}" class="look-stack-img" onerror="this.style.display='none'">
    <img src="${current.bottom}" class="look-stack-img" onerror="this.style.display='none'">
  `;
}

// ---------------------------
// 渲染左側大圖（單張）
// ---------------------------
function renderSingle(src) {
  const box = document.getElementById("look-image");
  // 同樣加入防呆
  box.innerHTML = `<img src="${src}" class="look-single-img" onerror="this.parentElement.innerHTML='<p>圖片載入失敗</p>'">`;
}

// ---------------------------
// 建立縮圖牆
// ---------------------------
function renderThumbnails() {
  const grid = document.getElementById("thumbnails-grid");

  const list = [
    { type: "full", src: null },      // 全身
    { type: "hat", src: current.hat },
    { type: "top", src: current.top },
    { type: "bottom", src: current.bottom }
  ];

  grid.innerHTML = list
    .map((item) => {
      // 1. 全身拼貼縮圖
      if (item.type === "full") {
        return `
          <div class="thumb-item active-thumb" data-type="full">
            <div class="thumb-stack">
              <img src="${current.hat}" onerror="this.style.display='none'">
              <img src="${current.top}" onerror="this.style.display='none'">
              <img src="${current.bottom}" onerror="this.style.display='none'">
            </div>
          </div>
        `;
      }
      
      // 2. 單品縮圖 (加入 onerror，如果沒帽子，連縮圖框框都隱藏)
      // 注意：這裡用 style="display: none" 預設隱藏，載入成功再顯示？
      // 不，比較簡單的方法是讓 onerror 觸發時隱藏整個 .thumb-item
      return `
        <div class="thumb-item" data-type="${item.type}" data-src="${item.src}">
          <img src="${item.src}" onerror="this.parentElement.style.display='none'">
        </div>
      `;
    })
    .join("");

  // 綁定點擊事件
  document.querySelectorAll(".thumb-item").forEach(t => {
    t.addEventListener("click", () => {
      // 移除其他 active
      document.querySelectorAll(".thumb-item").forEach(x => x.classList.remove("active-thumb"));
      t.classList.add("active-thumb");

      if (t.dataset.type === "full") {
        renderStacked();
      } else {
        renderSingle(t.dataset.src);
      }
    });
  });
}

// ---------------------------
// 主流程
// ---------------------------
document.addEventListener("DOMContentLoaded", () => {
  // 1. 讀取上一頁的選擇
  const raw = localStorage.getItem(RESULT_KEY);
  
  // 防呆：如果沒資料，先隨便假造一個預設值，方便你測試
  const data = raw ? JSON.parse(raw) : { 
    id: "campus-123-1", 
    title: "預覽模式", 
    note: "這是在沒有 localStorage 資料時的預設顯示", 
    color: "大地色", 
    style: "休閒" 
  };

  // 2. 更新文字介面
  const titleEl = document.getElementById("look-title");
  if(titleEl) titleEl.textContent = data.title;
  
  const noteEl = document.getElementById("look-note");
  if(noteEl) noteEl.textContent = data.note;
  
  const tagsEl = document.getElementById("look-tags");
  if(tagsEl) {
    tagsEl.innerHTML = `
      <span class="badge">${data.color}</span>
      <span class="badge">${data.style}</span>
    `;
  }

  // 3. 解析 ID 來決定要讀哪個資料夾
  // 假設 ID 格式為 "campus-timestamp-1"
  // 我們取最前面做 Style (campus)，取最後面做 Index (1)
  
  const parts = data.id.split("-");
  const styleId = parts[0]; // e.g., "campus"
  
  // 取最後一個部分當作 index (避免中間有其他 - 符號)
  let lookIndex = parseInt(parts[parts.length - 1]);
  if (isNaN(lookIndex)) lookIndex = 1; // 預設為 1 (a)

  console.log(`正在讀取: 風格=${styleId}, 第 ${lookIndex} 套 (對應資料夾 ${['a','b','c','d'][lookIndex-1]})`);

  // 4. 產生路徑並渲染
  current = resolvePath(styleId, lookIndex);
  
  renderStacked();
  renderThumbnails();

  // 5. 重新搭配按鈕 (回上一頁或首頁)
  const regenBtn = document.getElementById("regen-btn");
  if (regenBtn) {
    regenBtn.addEventListener("click", () => {
      // 如果你想回到選擇頁
      window.location.href = "idea.html";
    });
  }
});
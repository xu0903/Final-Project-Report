// -------------------------------
//   FitMatch — 完整版 gallery.js
// -------------------------------

const RESULT_KEY = "fitmatch_outfit_result";

// 對照：UI → JSON
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

let CLOTHING_DATA = null;
let current = { hat: null, top: null, bottom: null };

// ---------------------------
// 載入 clothingData.json
// ---------------------------
async function loadClothingJSON() {
  const res = await fetch("clothingData.json");
  CLOTHING_DATA = await res.json();
}

// ---------------------------
// 隨機挑一張照片
// ---------------------------
function pickRandom(style, category, color) {
  const s = MAP_STYLE[style] ?? style;
  const c = MAP_COLOR[color] ?? color;

  const list = CLOTHING_DATA?.[s]?.[category]?.[c];
  if (!list || list.length === 0) return null;

  return list[Math.floor(Math.random() * list.length)];
}

// ---------------------------
// 生成整套穿搭
// ---------------------------
function generateOutfit(style, color) {
  return {
    hat: pickRandom(style, "hat", color),
    top: pickRandom(style, "top", color),
    bottom: pickRandom(style, "bottom", color)
  };
}

// ---------------------------
// 渲染左側大圖（拼貼）
// ---------------------------
function renderStacked() {
  const box = document.getElementById("look-image");

  box.innerHTML = `
    ${current.hat ? `<img src="${current.hat}" class="look-stack-img">` : ""}
    ${current.top ? `<img src="${current.top}" class="look-stack-img">` : ""}
    ${current.bottom ? `<img src="${current.bottom}" class="look-stack-img">` : ""}
  `;
}

// ---------------------------
// 渲染左側大圖（單張）
// ---------------------------
function renderSingle(src) {
  const box = document.getElementById("look-image");
  box.innerHTML = `<img src="${src}" class="look-single-img">`;
}

// ---------------------------
// 建立縮圖牆
// ---------------------------
function renderThumbnails() {
  const grid = document.getElementById("thumbnails-grid");

  const list = [
    { type: "full", src: null },
    { type: "hat", src: current.hat },
    { type: "top", src: current.top },
    { type: "bottom", src: current.bottom }
  ];

  grid.innerHTML = list
    .map((item, i) => {
      if (item.type === "full") {
        return `
          <div class="thumb-item active-thumb" data-type="full">
            <div class="thumb-stack">
              ${current.hat ? `<img src="${current.hat}">` : ""}
              ${current.top ? `<img src="${current.top}">` : ""}
              ${current.bottom ? `<img src="${current.bottom}">` : ""}
            </div>
          </div>
        `;
      }
      return `
        <div class="thumb-item" data-type="${item.type}" data-src="${item.src}">
          <img src="${item.src}">
        </div>
      `;
    })
    .join("");

  // 綁定事件
  document.querySelectorAll(".thumb-item").forEach(t => {
    t.addEventListener("click", () => {
      document
        .querySelectorAll(".thumb-item")
        .forEach(x => x.classList.remove("active-thumb"));
      t.classList.add("active-thumb");

      if (t.dataset.type === "full") renderStacked();
      else renderSingle(t.dataset.src);
    });
  });
}

// ---------------------------
// 主流程
// ---------------------------
document.addEventListener("DOMContentLoaded", async () => {
  const raw = localStorage.getItem(RESULT_KEY);
  if (!raw) return;
  const data = JSON.parse(raw);

  document.getElementById("look-title").textContent = data.title;
  document.getElementById("look-note").textContent = data.note;
  document.getElementById("look-tags").innerHTML = `
      <span class="badge">${data.color}</span>
      <span class="badge">${data.style}</span>
  `;

  await loadClothingJSON();
  current = generateOutfit(data.styleKey, data.colorKey);

  renderStacked();
  renderThumbnails();

  // ===========================================
  // ❤️ 正確收藏按鈕（這段要加進來）
  // ===========================================
  const favBtn = document.getElementById("fav-btn");

  function refreshFavBtn() {
    const favs = JSON.parse(localStorage.getItem("fitmatch_favorites") || "[]");
    favBtn.textContent = favs.includes(data.id)
      ? "★ 已收藏"
      : "★ 收藏";
  }

  favBtn.addEventListener("click", () => {
    let favs = JSON.parse(localStorage.getItem("fitmatch_favorites") || "[]");

    if (favs.includes(data.id)) {
      favs = favs.filter(x => x !== data.id);
    } else {
      favs.push(data.id);
    }

    localStorage.setItem("fitmatch_favorites", JSON.stringify(favs));
    refreshFavBtn();
  });

  refreshFavBtn();

  // ===========================================
  // ❤️ 重新搭配按鈕（單純跳轉）
  // ===========================================
  const regenBtn = document.getElementById("regen-btn");
  regenBtn.addEventListener("click", () => {
    window.location.href = "outfit.html";
  });

});

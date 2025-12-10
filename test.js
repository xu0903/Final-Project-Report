// -------------------------------
//   FitMatch — 完整版 gallery.js
// -------------------------------
async function checkFavorite(outfitID) {
    const res = await fetch(`/check-favorite?outfitID=${encodeURIComponent(outfitID)}`, {
        method: "GET",
        credentials: "include"
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.isFavorite; // true / false
}


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
    ${current.bottom ? `<img src="${current.bottom}" class="look-stack-img">` : ""}`;
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

    const rawResult = localStorage.getItem(RESULT_KEY);
    if (!rawResult) return;

    const result = JSON.parse(rawResult);

    // ⭐ 如果缺 styleKey / colorKey → 自動補回
    if (!result.styleKey || !result.colorKey) {
        const [colorLabel, styleLabelWithLook] = result.title.split(" × ");
        const styleLabel = styleLabelWithLook.split(" ")[0];

        const LABEL_TO_KEY_COLOR = {
            "黑白灰": "blackgraywhite",
            "藍色": "blue",
            "大地色": "brown"
        };

        const LABEL_TO_KEY_STYLE = {
            "休閒": "simple",
            "甜美": "sweety",
            "街頭": "street",
            "正式": "formal"
        };

        result.colorKey = LABEL_TO_KEY_COLOR[colorLabel] ?? null;
        result.styleKey = LABEL_TO_KEY_STYLE[styleLabel] ?? null;

        // 修復後立即存回 localStorage
        localStorage.setItem(RESULT_KEY, JSON.stringify(result));
    }


    // 先載入 JSON
    await loadClothingJSON();

    // ⭐⭐ 若已有保存的 outfitImages，直接使用
    if (result.outfitImages) {
        current = result.outfitImages;
    } else {
        // ⭐ 第一次點進來：生成並存入 localStorage
        current = generateOutfit(result.styleKey, result.colorKey);

        result.outfitImages = current;   // ← 新增
        localStorage.setItem(RESULT_KEY, JSON.stringify(result));
    }

    // 渲染 UI
    document.getElementById("look-title").textContent = result.title;
    document.getElementById("look-note").textContent = result.note;
    document.getElementById("look-tags").innerHTML = `
                        <span class="badge">${result.color}</span>
                        <span class="badge">${result.style}</span>
                        `;

    renderStacked();
    renderThumbnails();

    // ⭐⭐ 檢查是否收藏
    const favBtn = document.getElementById("fav-btn");  // 你 gallery 的收藏按鈕 ID
    const isFav = await checkFavorite(result.id);

    if (isFav) {
        favBtn.textContent = "★ 已收藏";
        favBtn.classList.add("saved");
    } else {
        favBtn.textContent = "★ 收藏";
        favBtn.classList.remove("saved");
    }

    // ⭐⭐ 收藏按鈕點擊
    favBtn.addEventListener("click", async () => {

        const currentlyFav = await checkFavorite(result.id);

        if (currentlyFav) {
            // 取消收藏
            await fetch('/delete-favorite', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ outfitID: result.id })
            });
            favBtn.textContent = "★ 收藏";
            favBtn.classList.remove("saved");
        } else {
            // 新增收藏
            await fetch('/save-favorite', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ outfitID: result.id })
            });
            favBtn.textContent = "★ 已收藏";
            favBtn.classList.add("saved");
        }
    });

    const regenBtn = document.getElementById("regen-btn");
    regenBtn.addEventListener("click", () => {
        window.location.href = "outfit.html";
    });


});
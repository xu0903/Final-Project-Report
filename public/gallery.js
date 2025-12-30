// -------------------------------
//   FitMatch — 完整版 gallery.js
// -------------------------------

const RESULT_KEY = "fitmatch_outfit_result";

// 取得網址內的outfitID
const params = new URLSearchParams(window.location.search);
const outfitID = parseInt(params.get("outfitID"), 10);
const fromPage = params.get("from") || 'outfit.html';
console.log("fromPage =", fromPage);
if (!outfitID || Number.isNaN(outfitID)) {
  console.error("outfitID 缺失！");
  window.location.href = "outfit.html";
}

// 對照：UI → JSON
const MAP_STYLE = {
  "formal": "formal",
  "simple": "simple",
  "sweet": "sweet",
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

let current = { hat: null, top: null, bottom: null };


// ---------------------------
// 渲染左側大圖（拼貼）
// ---------------------------
function renderStacked() {
  const box = document.getElementById("look-image");
  box.classList.add("stack-mode");
  box.classList.remove("single-mode");
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
  box.classList.add("single-mode");
  box.classList.remove("stack-mode");
  box.innerHTML = `<img src="${src}" class="look-single-img">`;
}

// ---------------------------
// 建立縮圖牆
// ---------------------------
function renderThumbnails() {
  const grid = document.getElementById("thumbnails-grid");

  grid.innerHTML = `
    <div class="thumb-rect">
      <div class="thumb-stack-vertical">
        ${current.hat ? `<img class="thumb-hat" src="${current.hat}" />` : ""}
        ${current.top ? `<img class="thumb-top" src="${current.top}" />` : ""}
        ${current.bottom ? `<img class="thumb-bottom" src="${current.bottom}" />` : ""}
      </div>
    </div>

    ${current.hat ? `<div class="thumb-square"><img src="${current.hat}"></div>` : ""}
    ${current.top ? `<div class="thumb-square"><img src="${current.top}"></div>` : ""}
    ${current.bottom ? `<div class="thumb-square"><img src="${current.bottom}"></div>` : ""}
  `;

  // 綁定切換主圖
  document.querySelector(".thumb-rect").addEventListener("click", () => renderStacked());
  document.querySelectorAll(".thumb-square").forEach((el, idx) => {
    el.addEventListener("click", () => {
      const src = [current.hat, current.top, current.bottom][idx];
      renderSingle(src);
    });
  });
}


// ---------------------------
// 主流程
// ---------------------------
document.addEventListener("DOMContentLoaded", async () => {
  // const raw = localStorage.getItem(RESULT_KEY);
  // if (!raw) return;
  // const data = JSON.parse(raw);
  console.log("outfitID =", outfitID);
  const response = await fetch(`/get-outfit/${outfitID}`);
  const data = await response.json();
  const outfitData = data.outfit;
  if (!outfitData) {
    console.error("找不到 outfit 資料！");
    window.location.href = "outfit.html";
    return;
  }
  console.log("取得的 outfit 資料：", outfitData);
  console.log("Title", outfitData.Title);
  document.getElementById("look-title").textContent = outfitData.Title;
  document.getElementById("look-note").textContent = outfitData.Description;
  document.getElementById("look-tags").innerHTML = `
      <span class="badge">${outfitData.ColorLabel}</span>
      <span class="badge">${outfitData.StyleLabel}</span>
  `;
  console.log("StyleKey, ColorKey:", outfitData.StyleKey, outfitData.ColorKey);


  current.hat = outfitData.ImageHat;
  current.top = outfitData.ImageTop;
  current.bottom = outfitData.ImageBottom;

  console.log("current：", current);

  renderStacked();
  renderThumbnails();

  // ===========================================
  // ❤️ 正確收藏按鈕（這段要加進來）
  // ===========================================
  // const favBtn = document.getElementById("fav-btn");

  // function refreshFavBtn() {
  //   const favs = JSON.parse(localStorage.getItem("fitmatch_favorites") || "[]");
  //   favBtn.textContent = favs.includes(data.id)
  //     ? "★ 已收藏"
  //     : "★ 收藏";
  // }

  // favBtn.addEventListener("click", () => {
  //   let favs = JSON.parse(localStorage.getItem("fitmatch_favorites") || "[]");

  //   if (favs.includes(data.id)) {
  //     favs = favs.filter(x => x !== data.id);
  //   } else {
  //     favs.push(data.id);
  //   }

  //   localStorage.setItem("fitmatch_favorites", JSON.stringify(favs));
  //   refreshFavBtn();
  // });

  // refreshFavBtn();

  // ===========================================
  // 返回按鈕(跳轉回來源頁面)
  // ===========================================
  const returnBtn = document.getElementById("return-btn");
  returnBtn.addEventListener("click", () => {
    window.location.href = fromPage;
  });

});

const MAX_SELECT = 3;
let selectedOutfits = [];

function getColorBG(colorKey) {
  const colorBG = {
    earth: "#d4b89f",
    blackgraywhite: "#a2a1a1",
    pastel: "#f9dfe5",
    pink: "#ffb3c6",
    red: "#e26d5a",
    orange: "#ffb84c",
    yellow: "#ffe26a",
    lightgreen: "#b7e4c7",
    darkgreen: "#588157",
    lightblue: "#a0c4ff",
    blue: "#b7d7fc",
    purple: "#c77dff",
    brown: "#c7ac91",
  };
  return colorBG[colorKey] || "#e5e7eb";
}

document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("favorite-grid");

  if (!grid) {
    console.error("❌ 找不到 #favorite-grid");
    return;
  }

  try {
    const res = await fetch("/get-user-favorites", {
        credentials: "include"
    });

    const data = await res.json();
    console.log("choose favorites =", data);

    // 2️⃣ 沒資料的情況
    if (!data.success || !data.favorites || data.favorites.length === 0) {
      grid.innerHTML = `<p class="muted">目前沒有收藏的穿搭</p>`;
      return;
    }

    // 3️⃣ render 卡片
    grid.innerHTML = data.favorites
      .map(fav => createFavoriteCardHTML(fav))
      .join("");


    const countDisplay = document.getElementById("selected-count");

    grid.addEventListener("click", (e) => {
    const card = e.target.closest(".fav-card");
    if (!card) return;

    const outfitId = card.dataset.outfitId;

    // 已選 → 取消選取
    if (card.classList.contains("selected")) {
        card.classList.remove("selected");
        selectedOutfits = selectedOutfits.filter(id => id !== outfitId);
    } 
    // 未選 → 嘗試選取
    else {
        if (selectedOutfits.length >= MAX_SELECT) {
        alert("最多只能選 3 套穿搭");
        return;
        }
        card.classList.add("selected");
        selectedOutfits.push(outfitId);
    }

    // 更新下方數字
    countDisplay.textContent = `已選擇 ${selectedOutfits.length} / ${MAX_SELECT}`;
    });

  } catch (err) {
    console.error("❌ 載入收藏失敗", err);
    grid.innerHTML = `<p style="color:red;">載入收藏失敗</p>`;
  }
});

/* =========================
   產生單張收藏卡片 HTML
========================= */
function createFavoriteCardHTML(fav) {
  const bgColor = getColorBG(fav.ColorKey);

  return `
    <div class="fav-card" data-outfit-id="${fav.OutfitID}">
      <div class="check-badge">✓</div>

      <div class="fav-thumb" style="background:${bgColor}">
        ${
          fav.ImageURL
            ? `<img src="${fav.ImageURL}" alt="${escapeHTML(fav.Title)}">`
            : ""
        }
      </div>

      <div class="fav-body">
        <div class="fav-title">${escapeHTML(fav.Title)}</div>
        <div class="fav-tags">
          #${fav.ColorLabel} #${fav.StyleLabel}
        </div>
      </div>
    </div>
  `;
}


/* =========================
   防止 XSS
========================= */
function escapeHTML(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
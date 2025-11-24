// gallery.js — 結果展示頁邏輯

const RESULT_KEY = "fitmatch_result";
const FAVORITES_KEY = "fitmatch_favorites";

// 讀收藏
function loadFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveFavorites(list) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
}

// 生成 demo 圖片 (依 color + style)
function pickDemoImage(colorKey, styleKey) {
  // 假設圖片放在 /looks/
  const fname = `${colorKey}-${styleKey}-01.jpg`;
  return `looks/${fname}`;
}

document.addEventListener("DOMContentLoaded", () => {
  const raw = localStorage.getItem(RESULT_KEY);
  if (!raw) {
    document.getElementById("look-title").textContent = "無法載入結果";
    return;
  }

  const data = JSON.parse(raw);

  // 1. 顯示文字
  document.getElementById("look-title").textContent = data.title;
  document.getElementById("look-note").textContent = data.note;

  // 2. tags
  const tagBox = document.getElementById("look-tags");
  const tags = [data.color, data.style];
  tagBox.innerHTML = tags
    .map((t) => `<span class="badge">${t}</span>`)
    .join("");

  // 3. 圖片
  const imgBox = document.getElementById("look-image");
  const imgURL = pickDemoImage(data.colorKey, data.styleKey);
  imgBox.style.backgroundImage = `url('${imgURL}')`;

  // 4. 收藏
  document.getElementById("fav-btn").addEventListener("click", () => {
    const list = loadFavorites();
    const exist = list.some((item) => item.id === data.id);
    if (!exist) {
      list.push({
        id: data.id,
        title: data.title,
        color: data.color,
        style: data.style,
        note: data.note,
        image: imgURL,
      });
      saveFavorites(list);
    }

    const btn = document.getElementById("fav-btn");
    btn.textContent = "已收藏";
    btn.disabled = true;
  });

  // 5. 返回重新搭配
  document.getElementById("redo-btn").addEventListener("click", () => {
    window.location.href = "outfit.html";
  });
});

// gallery.js — 升級版結果展示頁邏輯

const RESULT_KEY = "fitmatch_result";
const FAVORITES_KEY = "fitmatch_favorites";

// ---------- 收藏讀寫 ----------
function loadFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveFavorites(list) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
}

// ---------- 生成 Demo 圖（依 color + style） ----------
function pickDemoImage(colorKey, styleKey, variant = 1) {
  // 產生三種角度 look圖
  const fname = `${colorKey}-${styleKey}-0${variant}.jpg`;
  return `looks/${fname}`;
}

document.addEventListener("DOMContentLoaded", () => {
  const raw = localStorage.getItem(RESULT_KEY);
  if (!raw) {
    document.getElementById("look-title").textContent = "無法載入結果";
    return;
  }

  const data = JSON.parse(raw);

  // ---------- 1. 主文字 ----------
  document.getElementById("look-title").textContent = data.title;
  document.getElementById("look-note").textContent = data.note;

  // ---------- 2. 標籤 ----------
  const tagBox = document.getElementById("look-tags");
  const tags = [data.color, data.style];

  if (data.gender) tags.push(data.gender);

  tagBox.innerHTML = tags.map(t => `<span class="badge">${t}</span>`).join("");

  // ---------- 3. 大圖展示 ----------
  const imgBox = document.getElementById("look-image");
  const defaultImg = pickDemoImage(data.colorKey, data.styleKey, 1);
  imgBox.style.backgroundImage = `url('${defaultImg}')`;

  // ---------- 4. 收藏按鈕（可取消收藏） ----------
  const favBtn = document.getElementById("fav-btn");
  const favList = loadFavorites();
  const alreadyFav = favList.some(x => x.id === data.id);

  // 初始化按鈕狀態
  if (alreadyFav) {
    favBtn.textContent = "★ 已收藏";
    favBtn.classList.add("active-fav");
  }

  favBtn.addEventListener("click", () => {
    const list = loadFavorites();
    const exist = list.some((item) => item.id === data.id);

    if (exist) {
      // 收回收藏
      const newList = list.filter(item => item.id !== data.id);
      saveFavorites(newList);
      favBtn.textContent = "★ 收藏";
      favBtn.classList.remove("active-fav");
    } else {
      // 新增收藏
      list.push({
        id: data.id,
        title: data.title,
        color: data.color,
        style: data.style,
        gender: data.gender,
        note: data.note,
        image: defaultImg,
      });
      saveFavorites(list);
      favBtn.textContent = "★ 已收藏";
      favBtn.classList.add("active-fav");
    }
  });

  // ---------- 5. 新增縮圖牆 ----------
  const thumbBox = document.getElementById("thumbnails-grid");

  // 三～四張縮圖
  const thumbImages = [
    pickDemoImage(data.colorKey, data.styleKey, 1),
    pickDemoImage(data.colorKey, data.styleKey, 2),
    pickDemoImage(data.colorKey, data.styleKey, 3),
    pickDemoImage(data.colorKey, data.styleKey, 4),
  ];

  thumbBox.innerHTML = thumbImages
    .map(
      (src, i) => `
      <div class="thumb-item ${i === 0 ? "active-thumb" : ""}" data-src="${src}">
        <img src="${src}" alt="thumbnail" />
      </div>
    `
    )
    .join("");

  // ---------- 6. 點縮圖 → 左側展示圖切換 ----------
  thumbBox.addEventListener("click", (e) => {
    const item = e.target.closest(".thumb-item");
    if (!item) return;

    const newSrc = item.dataset.src;
    imgBox.style.backgroundImage = `url('${newSrc}')`;

    // active 樣式
    document
      .querySelectorAll(".thumb-item")
      .forEach((el) => el.classList.remove("active-thumb"));
    item.classList.add("active-thumb");
  });

  // ---------- 7. 重新搭配（返回 outfit.html 並保留三張卡片） ----------
  document.getElementById("redo-btn").addEventListener("click", () => {
    // ❗ 不需要清除 fitmatch_lastIdeas
    // 直接跳回 outfit.html → 它會自動 restore 上次產生的三張卡片
    window.location.href = "idea.html";
  });
});

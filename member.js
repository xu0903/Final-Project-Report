const FAVORITES_KEY = "fitmatch_favorites";

function loadFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error("載入收藏穿搭失敗", e);
    return [];
  }
}

function renderFavorites() {
  const grid = document.getElementById("favorites-grid");
  if (!grid) return;

  const favorites = loadFavorites();

  if (!favorites.length) {
    grid.innerHTML = `
      <div class="favorites-empty muted">
        目前還沒有收藏任何穿搭，去 <strong>結果展示</strong> 或 <strong>找靈感</strong> 頁面試試收藏功能吧！
      </div>
    `;
    return;
  }

  grid.innerHTML = favorites
    .map((item, index) => {
      const title =
        (typeof item === "string" && item) ||
        item.title ||
        item.name ||
        `收藏穿搭 ${index + 1}`;

      const note =
        item.note ||
        item.style ||
        item.occasion ||
        item.weather ||
        "";

      const img =
        item.image ||
        item.img ||
        item.cover ||
        "";

      return `
        <article class="outfit-card">
          <div class="outfit-thumb" ${
            img ? `style="background-image:url('${img}')" ` : ""
          }></div>
          <div class="outfit-body">
            <h3 class="outfit-title">${escapeHTML(title)}</h3>
            ${
              note
                ? `<p class="outfit-note muted small">${escapeHTML(note)}</p>`
                : ""
            }
          </div>
        </article>
      `;
    })
    .join("");
}

document.addEventListener("DOMContentLoaded", () => {
  // ...上面帳號 / BMI 的程式...

  // 收藏穿搭
  renderFavorites();
});

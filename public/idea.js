// idea.js — 找靈感頁

const INSP_KEY = "fitmatch_inspiration";
const RESULT_KEY = "fitmatch_result";

/* --------------------- 顏色對照表 (新增) --------------------- */
// 將中文標籤轉換為 HEX 色碼
const tagColors = {
  "大地色": "#d4b89f",
  "黑白灰": "#9ca3af",
  "韓系": "#ffc8dd",   // 粉嫩色
  "日系": "#e6ccb2",   // 米色/卡其
  "休閒": "#bde0fe",   // 淺藍
  "歐美風": "#787878", // 深灰
  "正式": "#343a40",
  "溫柔": "#ffafcc"
};

/* --------------------- 靈感資料 --------------------- */
const inspirations = [
  {
    label: "campus",
    title: "校園日常",
    tags: ["大地色", "休閒", "寬褲"],
    note: "適合上課、社團、圖書館，一整天活動量偏高的日子。",
  },
  {
    label: "commute",
    title: "通勤辦公",
    tags: ["黑白灰", "襯衫", "正式"],
    note: "見客或開會、舒適與正式兼具的辦公風。",
  },
  {
    label: "date",
    title: "約會午後",
    tags: ["韓系", "溫柔", "針織"],
    note: "柔和色系上衣＋牛仔褲，乾淨好拍又不會太刻意。",
  },
  {
    label: "weekend",
    title: "週末出遊",
    tags: ["日系", "大地色", "層次感"],
    note: "適合戶外走走或逛市集，照片也很好看。",
  },
  {
    label: "sport",
    title: "運動休閒",
    tags: ["休閒", "機能", "寬鬆版型"],
    note: "打球、健身、夜跑，或只是想穿得很放鬆的日子。",
  },
  {
    label: "formal",
    title: "正式場合",
    tags: ["歐美風", "西裝", "黑白灰"],
    note: "面試、簡報、朋友家族聚餐都能駕馭。",
  },
];

/* --------------------- localStorage --------------------- */
function saveInspiration(data) {
  console.log("儲存靈感：", data);
  localStorage.setItem(INSP_KEY, JSON.stringify(data));
}
function loadInspiration() {
  try {
    const raw = localStorage.getItem(INSP_KEY);
    console.log("raw = ", raw);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/* --------------------- 生成 4 張推薦卡片 --------------------- */
function generateMiniCards(base) {
  const area = document.getElementById("insp-recommend");
  if (!area) return;

  // ⭐ 把 base（上方靈感卡的資料）一起存到 DOM，等等小卡片要用
  area.dataset.base = JSON.stringify(base);

  // ★ 取得對應顏色：抓取第一個標籤 (如"大地色")，去查表
  const mainTag = base.tags[0];
  const bgColor = tagColors[mainTag] || "#e5e7eb"; // 預設灰色

  const html = [];

  for (let i = 1; i <= 4; i++) {
    const data = {

    //後端資料庫要新增idea_outfit_id 不然收藏按鈕動不了

      id: `${base.id}-${Date.now()}-${i}`,


      title: `${base.title} Look ${i}`,
      color: base.tags[0] || "色系",
      style: base.tags[1] || "風格",
    };

    html.push(`
      <article class="idea-card"
        data-id="${data.id}"
        data-title="${data.title}"
        data-color="${data.color}"
        data-style="${data.style}"
        data-colorkey="earth"
        data-stylekey="eu">
      
        <!-- ★ 修正處：直接填入查到的色碼 bgColor -->
        <div class="idea-thumb" style="background-color: ${bgColor};"></div>

        <div class="idea-body">
          <h3 class="idea-title">${data.title}</h3>
          <p class="idea-tags muted small">
            #${data.color} #${data.style}
          </p>
          <button type="button" class="btn secondary btn-fav">★ 收藏</button>
        </div>
      </article>
    `);
  }

  area.innerHTML = html.join("");
  setupMiniCardClick();
  setupIdeaFavoriteButtons();
}

/* --------------------- 小卡片點擊 → gallery2 --------------------- */
function setupMiniCardClick() {
  const area = document.getElementById("insp-recommend");
  if (!area) return;

  const base = JSON.parse(area.dataset.base || "null");

  area.querySelectorAll(".idea-card").forEach((card) => {
    card.addEventListener("click", (e) => {

      // ⭐ 最重要：如果點擊到收藏按鈕 → 完全不要跳轉
      if (e.target.closest(".btn-fav")) return;

      // ⭐ 在跳進 gallery2 前，也保存上方靈感卡
      if (base) saveInspiration(base);

      const data = {
        id: card.dataset.id,
        title: card.dataset.title,
        color: card.dataset.color,
        style: card.dataset.style,
        colorKey: card.dataset.colorkey,
        styleKey: card.dataset.stylekey,
        note: `${card.dataset.color} × ${card.dataset.style} Look`,
      };

      localStorage.setItem(RESULT_KEY, JSON.stringify(data));
      window.location.href = "gallery2.html";
    });
  });
}


/* --------------------- 主流程 --------------------- */
document.addEventListener("DOMContentLoaded", () => {
  const cards = document.querySelectorAll(".insp-card");
  const detail = document.getElementById("insp-selected");
  const detailSection = document.getElementById("insp-detail");

  // ⭐ 預設隱藏（第一次進站）
  detailSection.classList.add("hidden");

  // ⭐ 若 localStorage 仍保存靈感 → 自動還原
  const stored = loadInspiration();
  console.log("載入靈感：", stored);

  if (stored) {
    // 標示 active
    const card = document.querySelector(`.insp-card[data-scene="${stored.id}"]`);
    if (card) card.classList.add("active");

    // 還原文字
    detail.innerHTML = `
      你選擇的是：<strong>${stored.title}</strong><br>
      建議關鍵字：${stored.tags.join("、")}<br>
      ${stored.note}
    `;

    // 還原四張小卡片 (會自動帶入顏色)
    generateMiniCards(stored);

    // 顯示下方區塊
    detailSection.classList.remove("hidden");
  }

  // ⭐ 點上方六張 insp-card
  cards.forEach((card) => {
    card.addEventListener("click", async () => {
      const label = card.dataset.scene;
      const data = inspirations.find((x) => x.label === label);
      if (!data) return;

      // active 樣式
      cards.forEach((c) => c.classList.remove("active"));
      card.classList.add("active");

      // 插入文字
      detail.innerHTML = `
        你選擇的是：<strong>${data.title}</strong><br>
        建議關鍵字：${data.tags.join("、")}<br>
        ${data.note}
      `;

      // ⭐ 儲存上方靈感卡（正式寫入 localStorage）
      saveInspiration(data);

      // 產生小卡片
      generateMiniCards(data);

      // 顯示下方
      detailSection.classList.remove("hidden");
    });
  });
});

// ==========================
// ⭐ 收藏功能（沿用 outfit.js）
// ==========================

// 檢查是否收藏
async function checkFavorite(outfitID) {
  const res = await fetch(`/check-favorite?outfitID=${encodeURIComponent(outfitID)}`, {
    method: "GET",
    credentials: "include"
  });
  if (!res.ok) return { isFavorite: false };
  return await res.json();
}

// 儲存收藏
async function saveFavorite(outfitID) {
  const res = await fetch('/save-favorite', {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ outfitID })
  });
  return await res.json();
}

// 取消收藏
async function deleteFavorite(outfitID) {
  const res = await fetch('/delete-favorite', {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ outfitID })
  });
  return await res.json();
}

function setupIdeaFavoriteButtons() {
  const area = document.getElementById("insp-recommend");
  if (!area) return;

  area.addEventListener("click", async (e) => {
    const btn = e.target.closest(".btn-fav");
    if (!btn) return;

    // ⭐ 防止跳轉
    e.stopPropagation();
    e.preventDefault();

    const card = btn.closest(".idea-card");
    const outfitID = card.dataset.id;

    // 1️⃣ 先查是否收藏
    const check = await checkFavorite(outfitID);

    // ⭐ 狀況 A：已收藏 → 取消收藏
    if (check.isFavorite) {
      const del = await deleteFavorite(outfitID);

      if (del.success) {
        btn.textContent = "★ 收藏";
        btn.classList.remove("saved");
      }
      return;
    }

    // ⭐ 狀況 B：未收藏 → 新增收藏
    const save = await saveFavorite(outfitID);

    if (save.success) {
      btn.textContent = "★ 已收藏";
      btn.classList.add("saved");
    } else {
      console.error("收藏失敗：", save);
      alert("收藏失敗，後端可能沒有收到 outfitID 😢");
    }
  });
}

// idea.js — 找靈感頁

const INSP_KEY = "fitmatch_inspiration";
const RESULT_KEY = "fitmatch_result";

/* --------------------- 靈感資料 --------------------- */
const inspirations = [
  {
    id: "campus",
    title: "校園日常",
    tags: ["大地色", "休閒", "寬褲"],
    note: "適合上課、社團、圖書館，一整天活動量偏高的日子。",
  },
  {
    id: "commute",
    title: "通勤辦公",
    tags: ["黑白灰", "襯衫", "正式"],
    note: "見客或開會、舒適與正式兼具的辦公風。",
  },
  {
    id: "date",
    title: "約會午後",
    tags: ["韓系", "溫柔", "針織"],
    note: "柔和色系上衣＋牛仔褲，乾淨好拍又不會太刻意。",
  },
  {
    id: "weekend",
    title: "週末出遊",
    tags: ["日系", "大地色", "層次感"],
    note: "適合戶外走走或逛市集，照片也很好看。",
  },
  {
    id: "sport",
    title: "運動休閒",
    tags: ["休閒", "機能", "寬鬆版型"],
    note: "打球、健身、夜跑，或只是想穿得很放鬆的日子。",
  },
  {
    id: "formal",
    title: "正式場合",
    tags: ["歐美風", "西裝", "黑白灰"],
    note: "面試、簡報、朋友家族聚餐都能駕馭。",
  },
];

/* --------------------- localStorage --------------------- */
function saveInspiration(data) {
  localStorage.setItem(INSP_KEY, JSON.stringify(data));
}
function loadInspiration() {
  try {
    const raw = localStorage.getItem(INSP_KEY);
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

  const html = [];

  for (let i = 1; i <= 4; i++) {
    const data = {
      id: `${base.id}-${Date.now()}-${i}`,
      title: `${base.title} Look ${i}`,
      color: base.tags[0] || "色系",
      style: base.tags[1] || "風格",
      gender: base.tags[2] || "中性",
    };

    html.push(`
      <article class="idea-card"
        data-id="${data.id}"
        data-title="${data.title}"
        data-color="${data.color}"
        data-style="${data.style}"
        data-gender="${data.gender}"
        data-colorkey="earth"
        data-stylekey="eu"
        data-genderkey="unisex">

        <div class="idea-thumb" style="background-color:#e8e3da;"></div>

        <div class="idea-body">
          <h3 class="idea-title">${data.title}</h3>
          <p class="idea-tags muted small">
            #${data.color} #${data.style} #${data.gender}
          </p>
        </div>
      </article>
    `);
  }

  area.innerHTML = html.join("");
  setupMiniCardClick();
}

/* --------------------- 小卡片點擊 → gallery2 --------------------- */
function setupMiniCardClick() {
  const area = document.getElementById("insp-recommend");
  if (!area) return;

  // ⭐ 取回上方靈感卡資料（非常重要）
  const base = JSON.parse(area.dataset.base || "null");

  area.querySelectorAll(".idea-card").forEach((card) => {
    card.addEventListener("click", () => {

      // ⭐ 在跳進 gallery2 前，也保存上方靈感卡
      if (base) saveInspiration(base);

      const data = {
        id: card.dataset.id,
        title: card.dataset.title,
        color: card.dataset.color,
        style: card.dataset.style,
        gender: card.dataset.gender,
        colorKey: card.dataset.colorkey,
        styleKey: card.dataset.stylekey,
        genderKey: card.dataset.genderkey,
        note: `${card.dataset.color} × ${card.dataset.style} × ${card.dataset.gender} Look`,
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

    // 還原四張小卡片
    generateMiniCards(stored);

    // 顯示下方區塊
    detailSection.classList.remove("hidden");
  }

  // ⭐ 點上方六張 insp-card
  cards.forEach((card) => {
    card.addEventListener("click", () => {
      const id = card.dataset.scene;
      const data = inspirations.find((x) => x.id === id);
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

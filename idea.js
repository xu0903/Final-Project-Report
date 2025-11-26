// idea.js — 找靈感頁

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

/* --------------------- 生成 4 張推薦卡片 --------------------- */
function generateMiniCards(base) {
  const area = document.getElementById("insp-recommend");
  if (!area) return;

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

/* --------------------- 小卡片點擊 → gallery --------------------- */
function setupMiniCardClick() {
  const area = document.getElementById("insp-recommend");
  if (!area) return;

  area.querySelectorAll(".idea-card").forEach((card) => {
    card.addEventListener("click", () => {
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
      window.location.href = "gallery.html";
    });
  });
}

/* --------------------- 主流程（最終版本） --------------------- */
document.addEventListener("DOMContentLoaded", () => {
  const cards = document.querySelectorAll(".insp-card");
  const detail = document.getElementById("insp-selected");
  const detailSection = document.getElementById("insp-detail");

  // 預設一定隱藏
  detailSection.classList.add("hidden");

  // 點擊上方靈感卡片
  cards.forEach((card) => {
    card.addEventListener("click", () => {
      const id = card.dataset.scene;
      const data = inspirations.find((x) => x.id === id);
      if (!data) return;

      // 標記 active 樣式
      cards.forEach((c) => c.classList.remove("active"));
      card.classList.add("active");

      // 顯示下方文字
      detail.innerHTML = `
        你選擇的是：<strong>${data.title}</strong><br>
        建議關鍵字：${data.tags.join("、")}<br>
        ${data.note}
      `;

      // 生成小卡片
      generateMiniCards(data);

      // 顯示下方區塊
      detailSection.classList.remove("hidden");
    });
  });
});

// idea.js － 找靈感頁

const INSP_KEY = "fitmatch_inspiration";

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
    tags: ["黑白灰", "襯衫", "Smart casual"],
    note: "要見同事或開會，又不想穿得太正式的工作日。",
  },
  {
    id: "date",
    title: "約會午後",
    tags: ["韓系", "溫柔", "針織"],
    note: "逛街、咖啡廳、看電影，整體感覺乾淨、舒服就加分很多。",
  },
  {
    id: "weekend",
    title: "週末出遊",
    tags: ["日系", "大地色", "層次感"],
    note: "適合戶外走走或一日遊，照片也會很好看。",
  },
  {
    id: "sport",
    title: "運動休閒",
    tags: ["Athleisure", "機能", "寬鬆版型"],
    note: "打球、健身、夜跑，或只是想穿得很放鬆的日子。",
  },
  {
    id: "formal",
    title: "正式場合",
    tags: ["歐美風", "西裝外套", "黑白灰"],
    note: "面試、簡報、正式聚會，可以偏正式但保留一點個人風格。",
  },
];

// 將選到的靈感存進 localStorage，給 outfit.html 用
function saveInspiration(data) {
  localStorage.setItem(INSP_KEY, JSON.stringify(data));
}

function loadInspiration() {
  try {
    const raw = localStorage.getItem(INSP_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error("載入靈感失敗", e);
    return null;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const cards = document.querySelectorAll(".insp-card");
  const detail = document.getElementById("insp-selected");
  const toOutfitBtn = document.getElementById("insp-to-outfit");

  // 恢復之前選過的靈感（如果有）
  const stored = loadInspiration();
  if (stored) {
    const card = document.querySelector(`.insp-card[data-scene="${stored.id}"]`);
    if (card) {
      card.classList.add("active");
    }
    detail.innerHTML = `
      上次你選擇的是：<strong>${stored.title}</strong><br>
      建議關鍵字：${stored.tags.join("、")}<br>
      <span class="muted small">${stored.note}</span>
    `;
    toOutfitBtn.disabled = false;
  }

  cards.forEach((card) => {
    card.addEventListener("click", () => {
      const id = card.dataset.scene;
      const data = inspirations.find((x) => x.id === id);
      if (!data) return;

      // 高亮目前卡片
      cards.forEach((c) => c.classList.remove("active"));
      card.classList.add("active");

      // 更新說明
      detail.innerHTML = `
        你選擇的是：<strong>${data.title}</strong><br>
        建議關鍵字：${data.tags.join("、")}<br>
        <span class="muted small">${data.note}</span>
      `;

      // 儲存到 localStorage
      saveInspiration(data);
      toOutfitBtn.disabled = false;
    });
  });

  // 帶去「風格篩選」頁
  toOutfitBtn.addEventListener("click", () => {
    const current = loadInspiration();
    if (!current) return;
    // 這裡單純 redirect，實際帶參數可以之後再補
    window.location.href = "outfit.html";
  });
<<<<<<< HEAD
});
=======
});
>>>>>>> 178840d1cb1d890c445405ee045f99205d46bf54

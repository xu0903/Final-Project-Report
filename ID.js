// member.js

const ACCOUNT_KEY = "fitmatch_account";
const PROFILE_KEY = "fitmatch_profile";
const FAVORITES_KEY = "fitmatch_favorites";

// 讀帳號資料
function loadAccount() {
  try {
    const raw = localStorage.getItem(ACCOUNT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error("載入帳號失敗", e);
    return null;
  }
}

// 存帳號資料
function saveAccount(data) {
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(data));
}

// 讀身高體重
function loadProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error("載入 profile 失敗", e);
    return null;
  }
}

// 存身高體重
function saveProfile(data) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(data));
}

// 計算 BMI
function calcBMI(heightCm, weightKg) {
  if (!heightCm || !weightKg) return null;
  const hM = heightCm / 100;
  const bmi = weightKg / (hM * hM);
  return bmi;
}

function bmiCategory(bmi) {
  if (bmi < 18.5) return "體重過輕";
  if (bmi < 24) return "正常範圍";
  if (bmi < 27) return "體重過重";
  if (bmi < 30) return "輕度肥胖";
  if (bmi < 35) return "中度肥胖";
  return "重度肥胖";
}

// 讀收藏穿搭
function loadFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    const data = raw ? JSON.parse(raw) : [];
    // 確保是陣列
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error("載入收藏穿搭失敗", e);
    return [];
  }
}

// 渲染收藏穿搭格子
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
      // 兼容不同格式：字串 / 物件
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
        ""; // 沒圖就用純色背景

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

// 簡單 XSS 防護
function escapeHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

document.addEventListener("DOMContentLoaded", () => {
  // ===== 帳號區 =====
  const accountForm = document.getElementById("account-form");
  const accountInput = document.getElementById("account");
  const passwordInput = document.getElementById("password");
  const accountMsg = document.getElementById("account-msg");

  const storedAccount = loadAccount();
  if (storedAccount) {
    accountInput.value = storedAccount.account || "";
    // 密碼仍然會被 <input type="password"> 遮蔽
    passwordInput.value = storedAccount.password || "";
  }

  accountForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const acc = accountInput.value.trim();
    const pwd = passwordInput.value;

    saveAccount({ account: acc, password: pwd });
    accountMsg.textContent = "已儲存帳號資訊（儲存在本機瀏覽器）。";
    setTimeout(() => (accountMsg.textContent = ""), 3000);
  });

  // ===== BMI 區 =====
  const bmiForm = document.getElementById("bmi-form");
  const heightInput = document.getElementById("height");
  const weightInput = document.getElementById("weight");
  const bmiResult = document.getElementById("bmi-result");

  const storedProfile = loadProfile();
  if (storedProfile) {
    if (storedProfile.height) heightInput.value = storedProfile.height;
    if (storedProfile.weight) weightInput.value = storedProfile.weight;
    if (storedProfile.bmi) {
      const cat = bmiCategory(storedProfile.bmi);
      bmiResult.innerHTML = `
        目前紀錄：身高 ${storedProfile.height} cm、體重 ${
        storedProfile.weight
      } kg<br>
        BMI 約為 <strong>${storedProfile.bmi.toFixed(
          1
        )}</strong>（${cat}）
      `;
    }
  }

  bmiForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const h = parseFloat(heightInput.value);
    const w = parseFloat(weightInput.value);

    if (!h || !w) return;
    const bmi = calcBMI(h, w);
    if (!bmi) return;

    const cat = bmiCategory(bmi);
    saveProfile({ height: h, weight: w, bmi });

    bmiResult.innerHTML = `
      身高 <strong>${h} cm</strong>、體重 <strong>${w} kg</strong><br>
      BMI 約為 <strong>${bmi.toFixed(1)}</strong>（${cat}）
    `;
  });

  // ===== 收藏穿搭 =====
  renderFavorites();
});

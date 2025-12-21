document.addEventListener("DOMContentLoaded", () => {
  // ===== 設定區 =====
  const API_BASE_URL = 'http://localhost:3000';

  // Storage Keys
  const REMEMBER_KEY = "fitmatch_remember";
  const SAVED_SESSIONS_KEY = "fitmatch_saved_sessions";
  const USERS_DB_KEY = "fitmatch_users"; // 本地備份資料庫

  // Views & Elements
  const loginView = document.getElementById("login-view");
  const loggedinView = document.getElementById("loggedin-view");
  const currentUserEmailEl = document.getElementById("current-user-email");
  const btnLogout = document.getElementById("btn-logout");

  const authWrap = document.querySelector(".centered-card");
  const loginForm = document.getElementById("login-form");
  const emailInput = document.getElementById("email");
  const pwdInput = document.getElementById("password");
  const captchaInput = document.getElementById("captcha");
  const captchaImg = document.getElementById("captcha-img");
  const refreshBtn = document.getElementById("refresh-captcha");
  const togglePassBtn = document.getElementById("toggle-pass");
  const rememberChk = document.getElementById("remember");
  const submitBtn = document.getElementById("submit");
  const msgBox = document.getElementById("msg");
  const forgotLink = document.getElementById("forgot");

  let switchAccountView = document.getElementById("switch-account-view");
  if (!switchAccountView) {
    switchAccountView = document.createElement("div");
    switchAccountView.id = "switch-account-view";
    switchAccountView.className = "hidden";
    if (authWrap) authWrap.insertBefore(switchAccountView, authWrap.firstChild);
  }

  // ===== 0. 狀態檢查 =====
  async function checkLoginState() {
    let savedSessions = [];
    try {
      // 只有切換帳號列表 (SAVED_SESSIONS_KEY) 仍然使用 LocalStorage
      savedSessions = JSON.parse(localStorage.getItem(SAVED_SESSIONS_KEY) || "[]");
    } catch (e) { }

    try {
      // ★ 關鍵：透過 API 檢查 JWT Cookie 來判斷登入狀態
      const response = await fetch(`${API_BASE_URL}/getUserData`, {
        method: 'GET',
        credentials: 'include' // 發送 JWT Cookie
      });

      // A. 已經登入 (API 回傳 200 OK)
      if (response.ok) {
        const data = await response.json();
        const accountData = {
          nickname: data.user.Username,
          account: data.user.Email,
          avatar: data.user.avatar,
          userId: data.user.UserID,
        };
        // 登入成功後，更新 LocalStorage 裡的 savedSessions 資料
        renderLoggedInView(accountData, savedSessions);
      }
      // B. 沒登入 (API 回傳 401 Unauthorized 或其他錯誤)
      else {
        if (savedSessions.length > 0) {
          renderSwitchAccountList(savedSessions); // 顯示切換帳號列表
        }
        // C. 完全沒紀錄
        else {
          showLoginForm(); // 顯示登入表單
        }
      }
    } catch (e) {
      console.error("檢查登入狀態失敗:", e);
      // API 連線失敗時，退回顯示登入表單或切換列表
      if (savedSessions.length > 0) {
        renderSwitchAccountList(savedSessions);
      } else {
        showLoginForm();
      }
    }
  }

  // 渲染：已登入畫面
  function renderLoggedInView(user, savedSessions) {
    if (!authWrap) return;
    if (loginForm) loginForm.style.display = "none";
    hideHeader();

    const displayName = user.nickname || user.username || "會員";
    const displayChar = displayName.charAt(0).toUpperCase();

    const html = `
      <div style="text-align: center; padding: 20px 0;">
        <div style="width: 80px; height: 80px; background: #c7a693; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 32px; margin: 0 auto 15px; border: 3px solid #fff; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
          ${user.avatar ? `<img src="${user.avatar}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">` : displayChar}
        </div>
        <h2 style="margin: 0 0 5px;">${displayName}</h2>
        <p class="muted" style="margin-bottom: 20px;">${user.account}</p>
        
        <button id="btn-continue" class="btn-login" style="margin-bottom: 10px;">繼續使用</button>
        ${savedSessions.length > 0 ? `<button id="btn-switch" class="btn-outline-login" style="margin-bottom: 10px;">切換帳號</button>` : ''}
        <button id="btn-logout-current" class="ghost" style="font-size: 14px; margin-top: 10px;">登出</button>
      </div>
    `;

    switchAccountView.innerHTML = html;
    switchAccountView.classList.remove("hidden");

    document.getElementById("btn-continue").onclick = () => window.location.href = "ID.html";
    const btnSwitch = document.getElementById("btn-switch");
    if (btnSwitch) btnSwitch.onclick = () => renderSwitchAccountList(savedSessions);

    document.getElementById("btn-logout-current").onclick = async () => {
      if (confirm("確定要登出嗎？")) {
        try { await fetch(`${API_BASE_URL}/logout`, { method: 'POST' }); } catch (e) { }
        checkLoginState();
      }
    };
  }

  // 渲染：切換帳號列表
  function renderSwitchAccountList(sessions) {
    if (!authWrap) return;
    if (loginForm) loginForm.style.display = "none";
    hideHeader();

    let listHtml = sessions.map(s => `
      <div class="account-item" data-account="${s.account}" style="display: flex; align-items: center; padding: 10px; border: 1px solid #eee; border-radius: 8px; margin-bottom: 10px; cursor: pointer; transition: background 0.2s;">
        <div style="width: 40px; height: 40px; background: #ddd; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-weight: bold; color: #555; overflow:hidden;">
          ${s.avatar ? `<img src="${s.avatar}" style="width:100%; height:100%; object-fit:cover;">` : (s.nickname ? s.nickname[0] : "M")}
        </div>
        <div style="flex: 1; text-align: left;">
          <div style="font-weight: 600; font-size: 15px;">${s.nickname || s.username || "會員"}</div>
          <div style="font-size: 12px; color: #888;">${s.account}</div>
        </div>
        <button class="ghost remove-acc" data-account="${s.account}" style="padding: 5px; font-size: 18px; color: #ccc;">&times;</button>
      </div>
    `).join("");

    const html = `
      <div style="text-align: center;">
        <h1 class="section-title">切換帳號</h1>
        <div style="margin-bottom: 20px;">${listHtml}</div>
        <button id="btn-add-account" class="btn-text" style="color: var(--accent); font-weight: bold; font-size: 15px;">+ 登入另一個帳號</button>
      </div>
    `;

    switchAccountView.innerHTML = html;
    switchAccountView.classList.remove("hidden");

    // 點擊直接登入
    document.querySelectorAll(".account-item").forEach(item => {
      item.addEventListener("click", async (e) => {
        if (e.target.classList.contains("remove-acc")) return;
        const targetUser = sessions.find(s => s.account === item.dataset.account);
        // 如果有存密碼，嘗試自動登入
        if (targetUser && targetUser.password) {
          await performApiLogin(targetUser.account, targetUser.password, false);
        } else {
          showLoginForm();
          if (emailInput) emailInput.value = targetUser.account;
        }
      });
    });

    // 刪除紀錄
    document.querySelectorAll(".remove-acc").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const accToRemove = btn.dataset.account;
        if (confirm(`移除 ${accToRemove} 的紀錄？`)) {
          const newSessions = sessions.filter(s => s.account !== accToRemove);
          localStorage.setItem(SAVED_SESSIONS_KEY, JSON.stringify(newSessions));
          newSessions.length === 0 ? showLoginForm() : renderSwitchAccountList(newSessions);
        }
      });
    });

    document.getElementById("btn-add-account").onclick = () => showLoginForm();
  }

  function showLoginForm() {
    if (switchAccountView) switchAccountView.classList.add("hidden");
    if (loginForm) loginForm.style.display = "block";
    showHeader();

    try {
      const rawRem = localStorage.getItem(REMEMBER_KEY);
      if (rawRem && emailInput) {
        const data = JSON.parse(rawRem);
        if (data.email) {
          emailInput.value = data.email;
          if (rememberChk) rememberChk.checked = true;
        }
      }
    } catch (e) { }
    updateSubmitState();
  }

  function hideHeader() {
    const h1 = authWrap.querySelector("h1");
    const p = authWrap.querySelector("p.muted");
    if (h1) h1.style.display = "none";
    if (p) p.style.display = "none";
  }
  function showHeader() {
    const h1 = authWrap.querySelector("h1");
    const p = authWrap.querySelector("p.muted");
    if (h1) h1.style.display = "block";
    if (p) p.style.display = "block";
  }

  // 執行檢查
  checkLoginState();

  // ===== 1. 驗證碼邏輯 =====
  const CAPTCHA_IMAGES = [
    { file: "0110.png", code: "0110" }, { file: "0484.png", code: "0484" },
    { file: "0815.png", code: "0815" }, { file: "0848.png", code: "0848" },
    { file: "1604.png", code: "1604" }, { file: "1679.png", code: "1679" },
    { file: "1875.png", code: "1875" }, { file: "2089.png", code: "2089" },
    { file: "2658.png", code: "2658" }, { file: "3104.png", code: "3104" },
    { file: "3355.png", code: "3355" }, { file: "4078.png", code: "4078" },
    { file: "4319.png", code: "4319" }, { file: "4822.png", code: "4822" },
    { file: "4986.png", code: "4986" }, { file: "5104.png", code: "5104" },
    { file: "5241.png", code: "5241" }, { file: "5606.png", code: "5606" },
    { file: "5738.png", code: "5738" }, { file: "6226.png", code: "6226" },
    { file: "6796.png", code: "6796" }, { file: "7541.png", code: "7541" },
    { file: "7767.png", code: "7767" }, { file: "8022.png", code: "8022" },
    { file: "8964.png", code: "8964" }, { file: "9243.png", code: "9243" },
    { file: "9290.png", code: "9290" }, { file: "9781.png", code: "9781" }
  ];

  let currentCaptcha = null;

  function pickRandomCaptcha() {
    if (!CAPTCHA_IMAGES.length) return;
    const idx = Math.floor(Math.random() * CAPTCHA_IMAGES.length);
    currentCaptcha = CAPTCHA_IMAGES[idx];
    const src = `CAPTCHA/${currentCaptcha.file}`;

    if (captchaImg) {
      captchaImg.src = src;
      captchaImg.style.display = 'block';
      captchaImg.onerror = () => { captchaImg.style.display = 'none'; };
    }
    if (captchaInput) {
      captchaInput.value = "";
      setFieldError(captchaInput, "");
    }
    updateSubmitState();
  }

  if (refreshBtn) refreshBtn.addEventListener("click", pickRandomCaptcha);
  if (captchaImg) captchaImg.addEventListener("click", pickRandomCaptcha);

  pickRandomCaptcha();

  // ===== 2. 輔助函式 =====
  function setFieldError(input, msg) {
    if (!input) return;
    const id = input.id;
    const small = document.querySelector(`small.err[data-for="${id}"]`);
    if (small) small.textContent = msg || "";
    if (msg) input.classList.add("invalid");
    else input.classList.remove("invalid");
  }

  function updateSubmitState() {
    if (!submitBtn) return;
    const hasEmail = emailInput && emailInput.value.trim().length > 0;
    const hasPwd = pwdInput && pwdInput.value.length >= 6;
    const hasCaptcha = captchaInput && captchaInput.value.trim().length > 0;
    submitBtn.disabled = !(hasEmail && hasPwd && hasCaptcha);
  }

  if (emailInput) emailInput.addEventListener("input", updateSubmitState);
  if (pwdInput) pwdInput.addEventListener("input", updateSubmitState);
  if (captchaInput) captchaInput.addEventListener("input", updateSubmitState);

  if (togglePassBtn && pwdInput) {
    togglePassBtn.addEventListener("click", () => {
      const type = pwdInput.getAttribute("type") === "password" ? "text" : "password";
      pwdInput.setAttribute("type", type);
      togglePassBtn.textContent = type === "password" ? "顯示" : "隱藏";
    });
  }

  // ===== 3. 表單送出 =====
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (msgBox) { msgBox.textContent = ""; msgBox.className = "msg"; }

      if (!currentCaptcha || !captchaInput || captchaInput.value.toLowerCase() !== currentCaptcha.code.toLowerCase()) {
        setFieldError(captchaInput, "驗證碼錯誤");
        if (msgBox) { msgBox.textContent = "驗證碼錯誤"; msgBox.classList.add("warning"); }
        pickRandomCaptcha();
        return;
      }

      const email = emailInput.value.trim();
      const password = pwdInput.value;

      submitBtn.disabled = true;
      submitBtn.textContent = "登入中...";

      await performApiLogin(email, password, true);
    });
  }

  // API 登入
  async function performApiLogin(email, password, isNewLogin) {
    try {
      const response = await fetch(`${API_BASE_URL}/authenticate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: password })
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (jsonErr) {
        console.warn("API 回傳非 JSON:", text);
        throw new Error("API_Unavailable");
      }

      if (response.ok) {
        const userData = {
          nickname: data.user.username,
          account: data.user.email,
          avatar: data.user.avatar,
          userId: data.user.userId
        };
        doLoginSuccess(userData, email, password, isNewLogin);
      } else {
        throw new Error(data.message || "帳號或密碼錯誤");
      }

    } catch (err) {
      console.error("Login Error:", err);

      // Fallback: 嘗試本地備份
      if (err.message === "API_Unavailable" || err.message.includes("Failed to fetch")) {
        const localSuccess = tryLocalLogin(email, password, isNewLogin);
        if (localSuccess) return;
      }

      if (msgBox) {
        msgBox.textContent = err.message === "API_Unavailable" ? "伺服器未啟動" : (err.message || "登入失敗");
        msgBox.classList.add("warning");
      }

      pickRandomCaptcha();
      if (submitBtn) { submitBtn.textContent = "登入"; submitBtn.disabled = false; }
    }
  }

  function tryLocalLogin(email, password, isNewLogin) {
    try {
      // 從本地備份資料庫讀取
      const rawUsers = localStorage.getItem(USERS_DB_KEY);
      if (rawUsers) {
        const users = JSON.parse(rawUsers);
        const user = users.find(u => u.account === email && u.password === password);
        if (user) {
          console.log("使用本地備份登入:", user.nickname);
          doLoginSuccess(user, email, password, isNewLogin);
          return true;
        }
      }
      // Demo
      if (email === "demo@fitmatch.dev" && password === "fitmatch") {
        doLoginSuccess({ account: email, nickname: "Demo用戶" }, email, password, isNewLogin);
        return true;
      }
    } catch (e) { }
    return false;
  }

  // 登入成功處理
  function doLoginSuccess(user, email, password, isNewLogin = true) {
    if (rememberChk && rememberChk.checked) {
      localStorage.setItem(REMEMBER_KEY, JSON.stringify({ email: email, remember: true }));
    } else {
      localStorage.removeItem(REMEMBER_KEY);
    }

    const activeUser = { ...user, account: email, password: password };

    // 無論是否為新登入 (isNewLogin)，都更新切換帳號列表
    // 這樣才能確保從 ID.js 修改後的暱稱/頭像，在下次登入時是新的
    let sessions = [];
    try { sessions = JSON.parse(localStorage.getItem(SAVED_SESSIONS_KEY) || "[]"); } catch (e) { }

    const idx = sessions.findIndex(s => s.account === email);
    if (idx >= 0) {
      sessions[idx] = { ...sessions[idx], ...activeUser }; // 更新資料
    } else {
      sessions.push(activeUser); // 新增資料
    }
    localStorage.setItem(SAVED_SESSIONS_KEY, JSON.stringify(sessions));

    if (msgBox) {
      msgBox.textContent = "登入成功！跳轉中...";
      msgBox.className = "msg success";
    }
    if (submitBtn) submitBtn.textContent = "成功";

    setTimeout(() => {
      window.location.href = "ID.html";
    }, 800);
  }
});

// ... 前面省略 ...
const USERS_DB_KEY = "fitmatch_users"; // 本地備份資料庫

// === 救援工具 ===
window.resetAllUsers = () => {
  localStorage.removeItem(USERS_DB_KEY);
  localStorage.removeItem(SAVED_SESSIONS_KEY);
  localStorage.removeItem(CURRENT_USER_KEY);
  alert("已清空所有本地使用者資料！");
  location.reload();
};
// ...
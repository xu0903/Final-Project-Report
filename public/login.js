
document.addEventListener("DOMContentLoaded", () => {
  // ===== 設定區 =====
  const API_BASE_URL = 'http://localhost:3000'; // 你的後端網址
  
  // Storage Keys
  const CURRENT_USER_KEY = "fitmatch_user";           // 當前正在使用的帳號 (Session)
  const SAVED_SESSIONS_KEY = "fitmatch_saved_sessions"; // 所有已儲存的帳號列表 (Array)
  const REMEMBER_KEY = "fitmatch_remember";           // 記住我 (只記 Email)
  const USERS_DB_KEY = "fitmatch_users";              // 本地端模擬資料庫 (Array)

  // === 救援工具：如果你卡住了，在 Console 輸入 resetAllUsers() 可以重置所有註冊資料 ===
  window.resetAllUsers = () => {
      localStorage.removeItem(USERS_DB_KEY);
      localStorage.removeItem(SAVED_SESSIONS_KEY);
      localStorage.removeItem(CURRENT_USER_KEY);
      alert("已清空所有本地使用者資料，現在可以重新註冊了！");
      location.reload();
  };
  console.log("提示：如果帳號卡住無法登入，請在 Console 輸入 resetAllUsers() 來重置資料。");

  // DOM Elements
  const authWrap = document.querySelector(".centered-card"); // 整個卡片容器
  const loginForm = document.getElementById("login-form"); // 登入表單
  
  // Form Inputs
  const emailInput = document.getElementById("email");
  const pwdInput = document.getElementById("password");
  const captchaInput = document.getElementById("captcha");
  const captchaImg = document.getElementById("captcha-img");
  const refreshBtn = document.getElementById("refresh-captcha");
  const togglePassBtn = document.getElementById("toggle-pass");
  const rememberChk = document.getElementById("remember");
  const submitBtn = document.getElementById("submit");
  const msgBox = document.getElementById("msg");


  // 動態建立「切換帳號」的 View
  let switchAccountView = document.getElementById("switch-account-view");
  if (!switchAccountView) {
    switchAccountView = document.createElement("div");
    switchAccountView.id = "switch-account-view";
    switchAccountView.className = "hidden"; 
    // 插入到卡片開頭 (在表單之前)
    if (authWrap) authWrap.insertBefore(switchAccountView, authWrap.firstChild);
  }

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
        captchaImg.onerror = () => captchaImg.style.display = 'none';
    }

    if (captchaInput) {
        captchaInput.value = "";
        setFieldError(captchaInput, "");
    }
    updateSubmitState();
  }

  if (refreshBtn) refreshBtn.addEventListener("click", pickRandomCaptcha);
  if (captchaImg) captchaImg.addEventListener("click", pickRandomCaptcha);

  // 初始化載入驗證碼
  pickRandomCaptcha();


  // ===== 2. 狀態管理與 UI 切換 =====
  
  // 檢查登入狀態 (入口點)
  checkLoginState();

  function checkLoginState() {
    const currentUserJson = localStorage.getItem(CURRENT_USER_KEY);
    let savedSessionsJson = localStorage.getItem(SAVED_SESSIONS_KEY);
    let savedSessions = savedSessionsJson ? JSON.parse(savedSessionsJson) : [];

    // 自動補登入 Session 邏輯
    if (currentUserJson) {
        try {
            const user = JSON.parse(currentUserJson);
            const exists = savedSessions.find(s => s.account === user.account);
            if (!exists) {
                savedSessions.push(user);
                localStorage.setItem(SAVED_SESSIONS_KEY, JSON.stringify(savedSessions));
            }
        } catch(e) {
            localStorage.removeItem(CURRENT_USER_KEY); // 清除壞掉的資料
        }
    }

    // UI 切換
    if (localStorage.getItem(CURRENT_USER_KEY)) {
        try {
            const user = JSON.parse(localStorage.getItem(CURRENT_USER_KEY));
            renderLoggedInView(user, savedSessions);
        } catch(e) {
            showLoginForm();
        }
    } 
    else if (savedSessions.length > 0) {
      renderSwitchAccountList(savedSessions);
    } 
    else {
      showLoginForm();
    }
  }

  // 渲染：已登入畫面
  function renderLoggedInView(user, savedSessions) {
    if (!authWrap) return;
    
    if (document.getElementById("login-view")) document.getElementById("login-view").classList.add("hidden");
    if (loginForm) loginForm.style.display = "none"; 

    // 隱藏標題
    const cardTitle = authWrap.querySelector("h1");
    if (cardTitle) cardTitle.style.display = "none";
    const cardDesc = authWrap.querySelector("p.muted");
    if (cardDesc) cardDesc.style.display = "none";

    const html = `
      <div style="text-align: center; padding: 20px 0;">
        <div style="width: 80px; height: 80px; background: #c7a693; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 32px; margin: 0 auto 15px; border: 3px solid #fff; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
          ${user.nickname ? user.nickname[0] : "Me"}
        </div>
        <h2 style="margin: 0 0 5px;">${user.nickname || "會員"}</h2>
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
    if (btnSwitch) {
        btnSwitch.onclick = () => renderSwitchAccountList(savedSessions);
    }
    
    document.getElementById("btn-logout-current").onclick = () => {
        if(confirm("確定要登出嗎？")) {
            localStorage.removeItem(CURRENT_USER_KEY);
            checkLoginState(); 
        }
    };
  }

  // 渲染：切換帳號列表
  function renderSwitchAccountList(sessions) {
    if (!authWrap) return;

    if (loginForm) loginForm.style.display = "none";
    if (document.getElementById("login-view")) document.getElementById("login-view").classList.add("hidden");
    
    const cardTitle = authWrap.querySelector("h1");
    if (cardTitle) cardTitle.style.display = "none";
    const cardDesc = authWrap.querySelector("p.muted");
    if (cardDesc) cardDesc.style.display = "none";

    let listHtml = sessions.map(s => `
      <div class="account-item" data-account="${s.account}" style="display: flex; align-items: center; padding: 10px; border: 1px solid #eee; border-radius: 8px; margin-bottom: 10px; cursor: pointer; transition: background 0.2s;">
        <div style="width: 40px; height: 40px; background: #ddd; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-weight: bold; color: #555;">
          ${s.nickname ? s.nickname[0] : "?"}
        </div>
        <div style="flex: 1; text-align: left;">
          <div style="font-weight: 600; font-size: 15px;">${s.nickname}</div>
          <div style="font-size: 12px; color: #888;">${s.account}</div>
        </div>
        <button class="ghost remove-acc" data-account="${s.account}" style="padding: 5px; font-size: 18px; color: #ccc;">&times;</button>
      </div>
    `).join("");

    const html = `
      <div style="text-align: center;">
        <h1 class="section-title">切換帳號</h1>
        <div style="margin-bottom: 20px;">
            ${listHtml}
        </div>
        <button id="btn-add-account" class="btn-text" style="color: var(--accent); font-weight: bold; font-size: 15px;">+ 登入另一個帳號</button>
      </div>
    `;

    switchAccountView.innerHTML = html;
    switchAccountView.classList.remove("hidden");

    document.querySelectorAll(".account-item").forEach(item => {
      item.addEventListener("click", (e) => {
        if (e.target.classList.contains("remove-acc")) return;
        
        const targetAccount = item.dataset.account;
        const targetUser = sessions.find(s => s.account === targetAccount);
        
        if (targetUser) {
           doLoginSuccess(targetUser, targetUser.account, targetUser.password, false); 
        }
      });
    });

    document.querySelectorAll(".remove-acc").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const accToRemove = btn.dataset.account;
        if (confirm(`確定要移除 ${accToRemove} 的登入紀錄嗎？`)) {
            const newSessions = sessions.filter(s => s.account !== accToRemove);
            localStorage.setItem(SAVED_SESSIONS_KEY, JSON.stringify(newSessions));
            // 如果刪光了，回到表單
            if (newSessions.length === 0) showLoginForm();
            else renderSwitchAccountList(newSessions);
        }
      });
    });

    document.getElementById("btn-add-account").onclick = () => {
        showLoginForm();
    };
  }

  // 顯示原始登入表單
  function showLoginForm() {
    switchAccountView.classList.add("hidden");
    
    if (loginForm) loginForm.style.display = "block";
    const loginViewDiv = document.getElementById("login-view");
    if(loginViewDiv) loginViewDiv.classList.remove("hidden");
    
    const cardTitle = authWrap.querySelector("h1");
    if (cardTitle) cardTitle.style.display = "block";
    const cardDesc = authWrap.querySelector("p.muted");
    if (cardDesc) cardDesc.style.display = "block";
    
    if(emailInput) emailInput.value = "";
    if(pwdInput) pwdInput.value = "";
    if(captchaInput) captchaInput.value = "";
    
    try {
        const rawRem = localStorage.getItem(REMEMBER_KEY);
        if (rawRem) {
            const data = JSON.parse(rawRem);
            if (data.email && emailInput) {
                emailInput.value = data.email;
                if(rememberChk) rememberChk.checked = true;
            }
        }
    } catch(e) {}
    
    updateSubmitState();
  }


  // ===== 3. 表單互動邏輯 =====
  function setFieldError(input, msg) {
    const id = input.id;
    const small = document.querySelector(`small.err[data-for="${id}"]`);
    if (small) small.textContent = msg || "";
    if (msg) input.classList.add("invalid");
    else input.classList.remove("invalid");
  }


  function updateSubmitState() {
    if (!submitBtn || !emailInput || !pwdInput || !captchaInput) return;
    const hasEmail = emailInput.value.trim().length > 0;
    const hasPwd = pwdInput.value.length >= 6;
    const hasCaptcha = captchaInput.value.trim().length > 0;
    submitBtn.disabled = !(hasEmail && hasPwd && hasCaptcha);
  }

  if(emailInput) emailInput.addEventListener("input", updateSubmitState);
  if(pwdInput) pwdInput.addEventListener("input", updateSubmitState);
  if(captchaInput) captchaInput.addEventListener("input", updateSubmitState);

  if(togglePassBtn) {
    togglePassBtn.addEventListener("click", () => {
      const type = pwdInput.getAttribute("type") === "password" ? "text" : "password";
      pwdInput.setAttribute("type", type);
      togglePassBtn.textContent = type === "password" ? "顯示" : "隱藏";
    });
  }


  // ===== 4. 表單送出 (與後端溝通) =====
  
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if(msgBox) msgBox.textContent = "";

      // 檢查驗證碼
      if (!currentCaptcha || captchaInput.value.toLowerCase() !== currentCaptcha.code.toLowerCase()) {
        setFieldError(captchaInput, "驗證碼錯誤");
        if(msgBox) {
            msgBox.textContent = "驗證碼錯誤";
            msgBox.className = "msg warning";
        }
        pickRandomCaptcha();
        return;
      } else {
        setFieldError(captchaInput, "");
      }

      const email = emailInput.value.trim();
      const password = pwdInput.value;
      
      if(submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = "登入中...";
      }

      try {
        // --- 發送 API 請求 ---
        let targetUrl = `${API_BASE_URL}/api/login`;
        if (!API_BASE_URL) console.warn("API_BASE_URL 未設定");

        const response = await fetch(targetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ account: email, password: password })
        });

        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (jsonErr) {
            // 如果解析失敗，通常是因為 API 網址錯誤回傳了 404 HTML
            // 這裡我們拋出一個具體的錯誤，讓 catch 去處理
            throw new Error("伺服器回應格式錯誤");
        }

        if (response.ok) {
          const userData = data.user || { account: email, nickname: "會員" };
          doLoginSuccess(userData, email, password, true);

        } else {
          throw new Error(data.message || "帳號或密碼錯誤");
        }

      } catch (err) {
        console.error("Login Error:", err);
        
        // --- Fallback: 本地端測試用 (Demo) ---
        console.log("API 連線失敗，嘗試使用 LocalStorage 驗證...");
        const localSuccess = tryLocalLogin(email, password);
        
        if (localSuccess) {
            return; // 本地登入成功，直接返回
        }
        
        // ★★★ 修正這裡：如果 API 和 本地都失敗，才顯示錯誤 ★★★
        if(msgBox) {
            // 如果錯誤訊息是 "伺服器回應格式錯誤" (代表 API 沒通)，且本地也沒找到人
            // 我們顯示 "帳號或密碼錯誤 (本地驗證失敗)" 讓使用者知道重點是帳密不對
            if (err.message === "伺服器回應格式錯誤") {
                msgBox.textContent = "帳號或密碼錯誤 (本地驗證失敗)";
            } else {
                msgBox.textContent = err.message || "伺服器連線錯誤";
            }
            msgBox.className = "msg warning";
        }
        
        pickRandomCaptcha();
        if(submitBtn) {
            submitBtn.textContent = "登入";
            submitBtn.disabled = false;
        }
      }
    });
  }

  // 本地端登入嘗試
  function tryLocalLogin(email, password) {
    try {
        const rawUsers = localStorage.getItem(USERS_DB_KEY); 
        if (rawUsers) {
            // 確保資料是 Array，防止舊資料造成 crash
            let users = [];
            try {
                users = JSON.parse(rawUsers);
                if (!Array.isArray(users)) users = [users]; // 如果是單一物件轉陣列
            } catch(e) { console.error("Local data corrupted"); }

            const user = users.find(u => u.account === email && u.password === password);
            if (user) {
                console.log("Local Login Success");
                doLoginSuccess(user, email, password, true);
                return true;
            }
        }
        // Demo 帳號
        if (email === "demo@fitmatch.dev" && password === "fitmatch") {
             doLoginSuccess({ account: email, nickname: "Demo用戶" }, email, password, true);
             return true;
        }
    } catch(e) {
        console.error("Try local login error", e);
    }
    return false;
  }

  // ===== 5. 登入成功處理 (核心) =====
  function doLoginSuccess(user, email, password, isNewLogin = true) {
    const activeUser = { ...user, account: email, password: password };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(activeUser));

<<<<<<< HEAD
    if (rememberChk && rememberChk.checked) {
      localStorage.setItem(REMEMBER_KEY, JSON.stringify({ email: email, remember: true }));
    } else if (rememberChk && !rememberChk.checked) {
      localStorage.removeItem(REMEMBER_KEY);
    }

    if (isNewLogin) {
        let sessions = [];
        try {
            sessions = JSON.parse(localStorage.getItem(SAVED_SESSIONS_KEY) || "[]");
        } catch(e) {}
        
        const idx = sessions.findIndex(s => s.account === email);
        if (idx >= 0) {
            sessions[idx] = activeUser;
        } else {
            sessions.push(activeUser);
        }
        localStorage.setItem(SAVED_SESSIONS_KEY, JSON.stringify(sessions));
    }
=======
    const email = emailInput.value.trim();
    const password = pwdInput.value;

    // 呼叫伺服器端驗證使用者
    const authResult = await authenticateUser(email, password);
    if (!authResult.success || !authResult.user) {
      msgBox.textContent = authResult.message;
      msgBox.classList.add("warning"); // ★ 新增：錯誤也讓訊息變紅
      pickRandomCaptcha();
      submitBtn.disabled = true;
      return;
    }
    else {
      // 登入成功
      console.log("User authenticated:", authResult.user);
    }

    // 記住我：記錄 email
    // if (rememberChk.checked) {
    //   localStorage.setItem(
    //     REMEMBER_KEY,
    //     JSON.stringify({ email, remember: true })
    //   );
    // } else {
    //   localStorage.removeItem(REMEMBER_KEY);
    // }

    // // 給會員頁用的帳號資訊
    // localStorage.setItem(
    //   ACCOUNT_KEY,
    //   JSON.stringify({ account: email, password })
    // );
>>>>>>> bd3b5a91b39c4499210c9a3bc755822345bd8bc3

    if(msgBox) {
        msgBox.textContent = "登入成功！跳轉中...";
        msgBox.className = "msg success";
    }
    if(submitBtn) submitBtn.textContent = "成功";

    setTimeout(() => {
        window.location.href = "ID.html";
    }, 500);
  }

  // 忘記密碼
  const forgotLink = document.getElementById("forgot");
  if(forgotLink) {
    forgotLink.addEventListener("click", (e) => {
      e.preventDefault();
      alert("請聯絡管理員或重新註冊帳號。");
    });
  }
});
document.addEventListener("DOMContentLoaded", () => {
  // 載入使用者收藏
  async function loadUserFavorites() {
    const grid = document.getElementById("fav-grid");
    if (!grid) return;

    try {
      const res = await fetch('/get-user-favorites');
      const data = await res.json();

      if (!data.success) {
        grid.innerHTML = `<p class="muted">無法取得收藏資料</p>`;
        return;
      }

      if (data.favorites.length === 0) {
        grid.innerHTML = `<p class="muted">你尚未收藏任何 outfit</p>`;
        return;
      }

      grid.innerHTML = data.favorites.map(fav => createFavoriteCardHTML(fav)).join("");
    } catch (err) {
      console.error(err);
      grid.innerHTML = `<p class="muted">載入收藏時發生錯誤</p>`;
    }
  }

  function getColorBG(colorKey) {
    const colorBG = {
      earth: "#d4b89f",
      mono: "#c4c4c4",
      pastel: "#f9dfe5",
      pink: "#ffb3c6",
      red: "#e26d5a",
      orange: "#ffb84c",
      yellow: "#ffe26a",
      lightgreen: "#b7e4c7",
      darkgreen: "#588157",
      lightblue: "#a0c4ff",
      blue: "#4361ee",
      purple: "#c77dff",
      brown: "#8b5e3c",
    };
    return colorBG[colorKey] || "#e5e7eb";
  }
  loadUserFavorites();// 載入使用者收藏

  // 產生收藏卡片 HTML
  function createFavoriteCardHTML(fav) {
    const bgColor = getColorBG(fav.ColorKey);

    return `
    <div class="idea-card">
      <div class="idea-thumb" style="background-color:${bgColor};">
        ${fav.ImageURL ? `<img src="${fav.ImageURL}" alt="${fav.Title}">` : ''}
      </div>
      <div class="idea-body">
        <h3 class="idea-title">${fav.Title}</h3>
        <p class="idea-tags muted small">
          #${fav.ColorLabel} #${fav.StyleLabel} #${fav.GenderLabel}
        </p>
        <p class="muted small">收藏時間：${new Date(fav.FavoritedAt).toLocaleString()}</p>
      </div>
    </div>
  `;
  }


  let userJson = null;

  function updateUI(user) {
    console.log("Updating UI with user data:", user);
    console.log("user type:", typeof (user));
    const nickNameEl = document.getElementById("display-nickname");
    const accountEl = document.getElementById("display-account");
    const logoutBtn = document.getElementById("btn-logout");
    const loginLink = document.getElementById("link-login");
    console.log("NickName Element:", user.Username);
    console.log("Account Element:", user.Email);

    if (user) {
      // 使用者已登入
      if (nickNameEl) nickNameEl.textContent = user.Username;
      if (accountEl) accountEl.textContent = user.Email;

      if (logoutBtn) logoutBtn.style.display = "inline-block";
      if (loginLink) loginLink.style.display = "none";
    } else {
      // 未登入
      if (nickNameEl) nickNameEl.textContent = "訪客";
      if (accountEl) accountEl.textContent = "尚無資料";

      if (logoutBtn) logoutBtn.style.display = "none";
      if (loginLink) loginLink.style.display = "inline-block";
    }
  }



  // 登出功能
  const logoutBtn = document.getElementById("btn-logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      if (confirm("確定要登出嗎？")) {
        // 呼叫後端登出 API 清除 cookie
        await fetch('/logout', { method: 'POST', credentials: 'include' });
        window.location.reload();
      }
    });
  }



  //=================================================================
  const API_BASE_URL = 'http://localhost:3000';

  // Storage Keys
  const USER_KEY = "fitmatch_user";
  const ACCOUNT_KEY = "fitmatch_account";
  const SAVED_SESSIONS_KEY = "fitmatch_saved_sessions";
  const USERS_DB_KEY = "fitmatch_users";

  // DOM Elements
  const displayNickname = document.getElementById("display-nickname");
  const displayAccount = document.getElementById("display-account");
  const btnLogout = document.getElementById("btn-logout");
  const loginLink = document.getElementById("link-login");

  // 編輯與頭像 DOM
  const nicknameViewMode = document.getElementById("nickname-view-mode");
  const nicknameEditMode = document.getElementById("nickname-edit-mode");
  const btnEditNickname = document.getElementById("btn-edit-nickname");
  const btnSaveNickname = document.getElementById("btn-save-nickname");
  const btnCancelNickname = document.getElementById("btn-cancel-nickname");
  const inputNickname = document.getElementById("input-nickname");

  const avatarContainer = document.getElementById("avatar-container");
  const avatarUpload = document.getElementById("avatar-upload");
  const avatarDisplayArea = document.getElementById("avatar-display-area");
  const btnRemoveAvatar = document.getElementById("btn-remove-avatar");

  // 1. 載入使用者資料
  async function loadUserData() {
    try {
      const res = await fetch('/getUserData', {
        method: 'GET',
        credentials: 'include'
      });
      const data = await res.json();

      if (!data.loggedIn) {
        return null;
      }

      return data.user; // 已經是物件
    } catch (err) {
      console.error('取得使用者資料失敗', err);
      return null;
    }
  }

  (async () => {//立即執行函式載入使用者資料
    userJson = await loadUserData();

    console.log("Loaded user data:", userJson);
    updateUI(userJson);
  })();

  //初始化渲染user資料
  loadUserProfile();
  function loadUserProfile() {
    if (userJson) {
      try {
        const user = JSON.parse(userJson);

        // 基本資料
        const name = user.Username || "會員";
        if (displayNickname) displayNickname.textContent = name;
        if (displayAccount) displayAccount.textContent = user.Email || "";
        if (inputNickname) inputNickname.value = name;

        // 頭像處理
        if (user.avatar) {
          renderAvatarImage(user.avatar);
          if (btnRemoveAvatar) btnRemoveAvatar.classList.remove("hidden");
        } else {
          renderAvatarText(name);
          if (btnRemoveAvatar) btnRemoveAvatar.classList.add("hidden");
        }

        // 按鈕狀態
        if (btnLogout) btnLogout.style.display = "inline-block";
        if (loginLink) loginLink.style.display = "none";

      } catch (e) {
        console.error("資料解析失敗", e);
      }
    } else {
      // 未登入
      if (displayNickname) displayNickname.textContent = "訪客";
      if (displayAccount) displayAccount.textContent = "請先登入";
      if (btnLogout) btnLogout.style.display = "none";
      if (loginLink) loginLink.style.display = "inline-block";
      if (btnEditNickname) btnEditNickname.style.display = "none";
      if (avatarContainer) avatarContainer.style.pointerEvents = "none";
    }
  }

  function renderAvatarText(name) {
    const firstChar = name ? name.charAt(0).toUpperCase() : "M";
    avatarDisplayArea.innerHTML = `<span id="avatar-text" style="font-size: 2.5rem; font-weight: bold; color: #c7a693;">${firstChar}</span>`;
    avatarDisplayArea.style.backgroundImage = "none";
  }

  function renderAvatarImage(base64Str) {
    avatarDisplayArea.innerHTML = "";
    avatarDisplayArea.style.backgroundImage = `url(${base64Str})`;
    avatarDisplayArea.style.backgroundSize = "cover";
    avatarDisplayArea.style.backgroundPosition = "center";
  }

  // 2. 暱稱編輯
  if (btnEditNickname) {
    btnEditNickname.addEventListener("click", () => {
      nicknameViewMode.classList.add("hidden");
      nicknameEditMode.classList.remove("hidden");
      inputNickname.focus();
    });
  }

  if (btnCancelNickname) {
    btnCancelNickname.addEventListener("click", () => {
      nicknameEditMode.classList.add("hidden");
      nicknameViewMode.classList.remove("hidden");
    });
  }

  if (btnSaveNickname) {
    btnSaveNickname.addEventListener("click", async () => {
      const newName = inputNickname.value.trim();
      if (!newName) {
        alert("暱稱不能為空！");
        return;
      }

      // 先更新本地 UI 和 Storage，讓使用者覺得很快
      updateLocalUser({ nickname: newName });

      displayNickname.textContent = newName;
      const user = JSON.parse(userJson);
      if (!user.avatar) renderAvatarText(newName);

      nicknameEditMode.classList.add("hidden");
      nicknameViewMode.classList.remove("hidden");

      // 再背景更新伺服器
      await updateServerProfile({ nickname: newName });
    });
  }

  // 3. 頭像上傳
  if (avatarContainer && avatarUpload) {
    avatarContainer.addEventListener("click", () => {
      avatarUpload.click();
    });

    avatarUpload.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (file.size > 2 * 1024 * 1024) {
        alert("圖片檔案過大，請選擇小於 2MB 的圖片");
        return;
      }

      const reader = new FileReader();
      reader.onload = async function (event) {
        const base64String = event.target.result;
        renderAvatarImage(base64String);
        if (btnRemoveAvatar) btnRemoveAvatar.classList.remove("hidden");

        updateLocalUser({ avatar: base64String });
        await updateServerProfile({ avatar: base64String });
      };
      reader.readAsDataURL(file);
    });
  }

  // 4. 移除頭像
  if (btnRemoveAvatar) {
    btnRemoveAvatar.addEventListener("click", async () => {
      if (!confirm("確定要移除目前的頭貼嗎？")) return;

      const user = JSON.parse(localStorage.getItem(USER_KEY) || "{}");
      const name = user.nickname || user.username || "M";
      renderAvatarText(name);

      btnRemoveAvatar.classList.add("hidden");

      updateLocalUser({ avatar: null });
      await updateServerProfile({ avatar: "" });
    });
  }

  // 5. 更新 LocalStorage
  function updateLocalUser(updates) {
    try {
      // A. 更新當前登入者
      let user = JSON.parse(userJson);
      user = { ...user, ...updates };
      localStorage.setItem(USER_KEY, JSON.stringify(user));

      // 取得 Email 用於比對 (統一轉小寫)
      const targetEmail = (user.account || user.email || "").toLowerCase();
      if (!targetEmail) return;

      // B. 更新切換帳號列表 (Saved Sessions)
      let sessions = JSON.parse(localStorage.getItem(SAVED_SESSIONS_KEY) || "[]");
      const idx = sessions.findIndex(s => (s.account || s.email || "").toLowerCase() === targetEmail);
      if (idx !== -1) {
        sessions[idx] = { ...sessions[idx], ...updates };
        localStorage.setItem(SAVED_SESSIONS_KEY, JSON.stringify(sessions));
      }

      // C. 同步更新本地備份資料庫 (fitmatch_users)
      let usersDB = JSON.parse(localStorage.getItem(USERS_DB_KEY) || "[]");
      const dbIdx = usersDB.findIndex(u => (u.account || u.email || "").toLowerCase() === targetEmail);
      if (dbIdx !== -1) {
        usersDB[dbIdx] = { ...usersDB[dbIdx], ...updates };
        localStorage.setItem(USERS_DB_KEY, JSON.stringify(usersDB));
      }

    } catch (e) { console.error("Update local error", e); }
  }

  // 6. 呼叫後端 (增加錯誤提示)
  async function updateServerProfile(data) {
    try {
      const user = JSON.parse(userJson);
      if (!user) return;

      const response = await fetch(`${API_BASE_URL}/update-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: user.Email, ...data })
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "伺服器更新失敗");
      }
      console.log("伺服器資料更新成功");

    } catch (err) {
      console.error("API error", err);
      alert("⚠️ 注意：無法連線到伺服器，您的變更僅暫存於本機。\n(若切換帳號或清除快取，變更可能會遺失)");
    }
  }

  // 7. 登出
  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      if (confirm("確定要登出嗎？")) {
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(ACCOUNT_KEY);
        window.location.href = "login.html";
      }
    });
  }
});
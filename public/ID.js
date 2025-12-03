document.addEventListener("DOMContentLoaded", () => {
  const API_BASE_URL = 'http://localhost:3000'; 
  
  // Storage Keys
  const USER_KEY = "fitmatch_user";           
  const ACCOUNT_KEY = "fitmatch_account";     
  const SAVED_SESSIONS_KEY = "fitmatch_saved_sessions"; 

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

  // 1. 初始化載入
  loadUserProfile();

  function loadUserProfile() {
    const userJson = localStorage.getItem(USER_KEY);
    
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        
        // 基本資料
        const name = user.nickname || user.username || "會員";
        if (displayNickname) displayNickname.textContent = name;
        if (displayAccount) displayAccount.textContent = user.account || user.email || "";
        if (inputNickname) inputNickname.value = name;

        // 頭像處理
        if (user.avatar) {
            renderAvatarImage(user.avatar);
            if(btnRemoveAvatar) btnRemoveAvatar.classList.remove("hidden");
        } else {
            renderAvatarText(name);
            if(btnRemoveAvatar) btnRemoveAvatar.classList.add("hidden");
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
      // 未登入隱藏編輯按鈕
      if (btnEditNickname) btnEditNickname.style.display = "none";
      if (avatarContainer) avatarContainer.style.pointerEvents = "none"; // 禁止點擊
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
      updateLocalUser({ nickname: newName });
      
      displayNickname.textContent = newName;
      // 如果目前是文字頭像，要更新文字
      const user = JSON.parse(localStorage.getItem(USER_KEY));
      if (!user.avatar) renderAvatarText(newName);

      nicknameEditMode.classList.add("hidden");
      nicknameViewMode.classList.remove("hidden");

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
      reader.onload = async function(event) {
        const base64String = event.target.result;
        renderAvatarImage(base64String);
        if(btnRemoveAvatar) btnRemoveAvatar.classList.remove("hidden");
        
        updateLocalUser({ avatar: base64String });
        await updateServerProfile({ avatar: base64String });
      };
      reader.readAsDataURL(file);
    });
  }

  // 4. ★ 新增：移除頭像
  if (btnRemoveAvatar) {
    btnRemoveAvatar.addEventListener("click", async () => {
        if (!confirm("確定要移除目前的頭貼嗎？")) return;

        // 恢復文字頭像
        const user = JSON.parse(localStorage.getItem(USER_KEY) || "{}");
        const name = user.nickname || user.username || "M";
        renderAvatarText(name);
        
        // 隱藏移除按鈕
        btnRemoveAvatar.classList.add("hidden");

        // 更新資料 (設為 null)
        updateLocalUser({ avatar: null });
        
        // 通知後端 (傳空字串代表刪除)
        await updateServerProfile({ avatar: "" });
    });
  }

  // 5. 更新 LocalStorage
  function updateLocalUser(updates) {
    try {
      let user = JSON.parse(localStorage.getItem(USER_KEY) || "{}");
      user = { ...user, ...updates };
      localStorage.setItem(USER_KEY, JSON.stringify(user));

      let sessions = JSON.parse(localStorage.getItem(SAVED_SESSIONS_KEY) || "[]");
      const idx = sessions.findIndex(s => s.account === user.account);
      if (idx !== -1) {
        sessions[idx] = { ...sessions[idx], ...updates };
        localStorage.setItem(SAVED_SESSIONS_KEY, JSON.stringify(sessions));
      }
    } catch (e) { console.error("Update local error", e); }
  }

  // 6. 呼叫後端
  async function updateServerProfile(data) {
    try {
      const user = JSON.parse(localStorage.getItem(USER_KEY) || "{}");
      if (!user.account) return;

      await fetch(`${API_BASE_URL}/update-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', 
        body: JSON.stringify({ email: user.account, ...data })
      });
    } catch (err) { console.error("API error", err); }
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
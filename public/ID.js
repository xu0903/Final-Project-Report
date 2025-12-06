document.addEventListener("DOMContentLoaded", () => {
  // 載入使用者收藏
  async function loadUserFavorites() {
    const grid = document.getElementById("fav-grid");
    if (!grid) return;

    try {
      // 後端 API 取得使用者收藏
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


  let userJson = null; // 儲存從後端載入的使用者物件資料

  function updateUI(user) {
    console.log("Updating UI with user data:", user);
    console.log("user type:", typeof (user));
    const nickNameEl = document.getElementById("display-nickname");
    const accountEl = document.getElementById("display-account");
    const logoutBtn = document.getElementById("btn-logout");
    const loginLink = document.getElementById("link-login");
    console.log("NickName Element:", user ? user.Username : "N/A");
    console.log("Account Element:", user ? user.Email : "N/A");

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
        // 重載頁面或導向登入頁
        window.location.reload();
      }
    });
  }



  //=================================================================
  const API_BASE_URL = 'http://localhost:3000';

  // **移除 Local Storage Keys**

  // DOM Elements
  const displayNickname = document.getElementById("display-nickname");
  const displayAccount = document.getElementById("display-account");
  // const btnLogout = document.getElementById("btn-logout"); // 已在上方宣告
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

  // 1. 載入使用者資料 (從後端取得，透過 cookie 判斷登入狀態)
  async function loadUserData() {
    try {
      const res = await fetch('/getUserData', {
        method: 'GET',
        credentials: 'include' // 確保發送 cookie
      });
      const data = await res.json();

      if (!data.loggedIn) {
        return null;
      }

      return data.user; // 假設後端返回的 data.user 是一個使用者物件
    } catch (err) {
      console.error('取得使用者資料失敗', err);
      return null;
    }
  }

  (async () => {//立即執行函式載入使用者資料
    userJson = await loadUserData();

    console.log("Loaded user data:", userJson);
    updateUI(userJson);
    loadUserProfile(); // 資料載入後再初始化渲染
  })();

  //初始化渲染user資料
  function loadUserProfile() {
    if (userJson) {
      try {
        // 假設 userJson 已經是一個物件 { Username: "...", Email: "...", avatar: "..." }
        const user = userJson;

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
        if (logoutBtn) logoutBtn.style.display = "inline-block";
        if (loginLink) loginLink.style.display = "none";

      } catch (e) {
        console.error("資料處理失敗", e);
      }
    } else {
      // 未登入
      if (displayNickname) displayNickname.textContent = "訪客";
      if (displayAccount) displayAccount.textContent = "請先登入";
      if (logoutBtn) logoutBtn.style.display = "none";
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
      // 取消時，將輸入框還原為當前 userJson 中的值
      if (userJson) inputNickname.value = userJson.Username || "";
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
      if (!userJson) {
        alert("使用者未登入，無法儲存！");
        return;
      }

      // 呼叫後端更新
      const updateSuccess = await updateServerProfile({ nickname: newName });

      if (updateSuccess) {
        // 更新成功後，更新本地 userJson 和 UI
        userJson.Username = newName; // 假設後端更新成功後，本地 userJson 更新
        displayNickname.textContent = newName;
        if (!userJson.avatar) renderAvatarText(newName);

        nicknameEditMode.classList.add("hidden");
        nicknameViewMode.classList.remove("hidden");
      } else {
        // 失敗時保持編輯模式
        alert("更新暱稱失敗，請檢查網路或稍後再試。");
      }
    });
  }

  // 3. 頭像上傳
  if (avatarContainer && avatarUpload) {
    // 點擊事件 (保持不變)
    avatarContainer.addEventListener("click", () => {
      if (!userJson) {
        alert("請先登入才能上傳頭像！");
        return;
      }
      avatarUpload.click();
    });

    // 處理檔案選擇變更事件 (Change 監聽器)
    avatarUpload.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // 檢查檔案大小
      if (file.size > 2 * 1024 * 1024) {
        alert("圖片檔案過大，請選擇小於 2 MB 的圖片");
        return;
      }

      const reader = new FileReader();

      // 使用箭頭函式，並在內部使用 IIFE (立即執行函式) 來處理 async/await
      reader.onload = (event) => {
        (async () => {
          const base64String = event.target.result; // 取得 Base64 字串

          // 1. 呼叫後端更新 API
          const updateSuccess = await updateServerProfile({ avatar: base64String });

          if (updateSuccess) {
            // 2. 更新成功後，更新本地 UI 顯示
            userJson.avatar = base64String;
            renderAvatarImage(base64String); // 顯示新頭像
            if (btnRemoveAvatar) btnRemoveAvatar.classList.remove("hidden");
            alert("頭像上傳成功！");
          } else {
            // 3. 失敗時給予提示
            alert("上傳頭像失敗，請檢查網路或稍後再試。");
          }
        })(); // 立即執行非同步函式
      };

      // 讀取檔案，並以 Data URL (Base64) 格式儲存結果
      reader.readAsDataURL(file);
    });
  }

  // 4. 移除頭像
  if (btnRemoveAvatar) {
    btnRemoveAvatar.addEventListener("click", async () => {
      if (!confirm("確定要移除目前的頭貼嗎？")) return;
      if (!userJson) return;

      // 呼叫後端更新
      const updateSuccess = await updateServerProfile({ avatar: "" });

      if (updateSuccess) {
        // 更新成功後，更新本地 userJson 和 UI
        userJson.avatar = "";
        const name = userJson.Username || "M";
        renderAvatarText(name);
        btnRemoveAvatar.classList.add("hidden");
      } else {
        alert("移除頭像失敗，請檢查網路或稍後再試。");
      }
    });
  }

  // 5. 呼叫後端 (更新使用者資料)
  async function updateServerProfile(data) {
    try {
      if (!userJson) {
        console.error("使用者未登入，無法更新伺服器資料");
        return false;
      }
      const user = userJson;

      const response = await fetch(`${API_BASE_URL}/update-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        // 傳送 UserID 作為使用者識別
        body: JSON.stringify({ userId: user.UserID, ...data })
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "伺服器更新失敗");
      }
      console.log("伺服器資料更新成功");
      return true;

    } catch (err) {
      console.error("API error", err);
      alert(`⚠️ 注意：伺服器更新失敗！\n錯誤訊息: ${err.message}`);
      return false;
    }
  }
});
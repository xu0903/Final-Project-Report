document.addEventListener("DOMContentLoaded", () => {
  const API_BASE_URL = 'http://localhost:3000';

  // ==========================================
  // 1. 設定與變數
  // ==========================================
  const USER_KEY = "fitmatch_user";
  const ACCOUNT_KEY = "fitmatch_account";
  const SAVED_SESSIONS_KEY = "fitmatch_saved_sessions";
  const USERS_DB_KEY = "fitmatch_users";
  const RESULT_KEY = "fitmatch_result"; // 跳轉用的 key

  // DOM Elements (資料顯示)
  const displayNickname = document.getElementById("display-nickname");
  const displayAccount = document.getElementById("display-account");
  const btnLogout = document.getElementById("btn-logout");
  const loginLink = document.getElementById("link-login");

  // DOM Elements (編輯暱稱)
  const nicknameViewMode = document.getElementById("nickname-view-mode");
  const nicknameEditMode = document.getElementById("nickname-edit-mode");
  const btnEditNickname = document.getElementById("btn-edit-nickname");
  const btnSaveNickname = document.getElementById("btn-save-nickname");
  const btnCancelNickname = document.getElementById("btn-cancel-nickname");
  const inputNickname = document.getElementById("input-nickname");

  // DOM Elements (頭像)
  const avatarContainer = document.getElementById("avatar-container");
  const avatarUpload = document.getElementById("avatar-upload");
  const avatarDisplayArea = document.getElementById("avatar-display-area");
  const btnRemoveAvatar = document.getElementById("btn-remove-avatar");
  const avatarText = document.getElementById("avatar-text");

  // DOM Elements (身體數值)
  const inputHeight = document.getElementById("input-height");
  const inputWeight = document.getElementById("input-weight");
  const bmiValueEl = document.getElementById("bmi-value");
  const bmiStatusEl = document.getElementById("bmi-status");
  const btnSaveBody = document.getElementById("btn-save-body");

  // 全域變數
  let userJson = null;

  // ==========================================
  // 2. 初始化流程 (IIFE)
  // ==========================================
  (async () => {
    // 嘗試從伺服器取得最新資料
    const freshData = await loadUserData();
    
    if (freshData) {
      userJson = freshData;
      localStorage.setItem(USER_KEY, freshData);
      
      // 同步更新給留言板用的資料 (LocalStorage)
      try {
        const userObj = JSON.parse(freshData);
        localStorage.setItem("fitmatch_user", JSON.stringify({
          nickname: userObj.Username,
          username: userObj.Username,
          avatar: userObj.Avatar,
          email: userObj.Email,
          id: userObj.UserID
        }));
      } catch(e) { console.error("同步留言板資料錯誤", e); }
    } else {
      // 如果伺服器沒回應或沒登入，嘗試讀取本地快取
      userJson = localStorage.getItem(USER_KEY);
    }

    // 根據資料更新 UI
    updateUI(userJson ? JSON.parse(userJson) : null);
    loadUserProfile();
    loadUserFavorites(); // 載入收藏列表
  })();

  // 從後端載入使用者資料
  async function loadUserData() {
    try {
      const res = await fetch('/getUserData', {
        method: 'GET',
        credentials: 'include'
      });
      const data = await res.json();
      if (!data.loggedIn) return null;
      return JSON.stringify(data.user);
    } catch (err) {
      console.error('取得使用者資料失敗 (可能未啟動 Server)', err);
      return null;
    }
  }

  // 更新 Header/登入按鈕狀態
  function updateUI(user) {
    if (user) {
      // 已登入
      if (displayNickname) displayNickname.textContent = user.Username || "會員";
      if (displayAccount) displayAccount.textContent = user.Email || "";
      if (btnLogout) btnLogout.style.display = "inline-block";
      if (loginLink) loginLink.style.display = "none";
    } else {
      // 未登入
      if (displayNickname) displayNickname.textContent = "訪客";
      if (displayAccount) displayAccount.textContent = "尚無資料";
      if (btnLogout) btnLogout.style.display = "none";
      if (loginLink) loginLink.style.display = "inline-block";
    }
  }

  // ==========================================
  // 3. 會員資料渲染 (頭像與暱稱)
  // ==========================================
  function loadUserProfile() {
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        const name = user.Username || user.nickname || "會員";

        // 更新文字
        if (displayNickname) displayNickname.textContent = name;
        if (displayAccount) displayAccount.textContent = user.Email || user.account || "";
        if (inputNickname) inputNickname.value = name;

        // 填入身體數值
        if (inputHeight) inputHeight.value = user.Height || "";
        if (inputWeight) inputWeight.value = user.Weight || "";
        // 渲染 BMI
        calculateBMI();

        // 更新頭像
        if (user.Avatar || user.avatar) {
          const avatarSrc = user.Avatar || user.avatar;
          renderAvatarImage(avatarSrc);
          if (btnRemoveAvatar) btnRemoveAvatar.classList.remove("hidden");
        } else {
          renderAvatarText(name);
          if (btnRemoveAvatar) btnRemoveAvatar.classList.add("hidden");
        }

      } catch (e) { console.error("解析使用者資料錯誤", e); }
    } else {
      // 未登入時隱藏編輯功能
      if (btnEditNickname) btnEditNickname.style.display = "none";
      if (avatarContainer) avatarContainer.style.pointerEvents = "none";
      // 禁用身體數值輸入
      if (inputHeight) inputHeight.disabled = true;
      if (inputWeight) inputWeight.disabled = true;
      if (btnSaveBody) btnSaveBody.disabled = true;
    }
  }

  // 輔助函式：顯示文字頭像
  function renderAvatarText(name) {
    if (!avatarDisplayArea) return;
    const firstChar = name ? name.charAt(0).toUpperCase() : "M";
    avatarDisplayArea.innerHTML = `<span id="avatar-text" style="font-size: 2.5rem; font-weight: bold; color: #c7a693;">${firstChar}</span>`;
    avatarDisplayArea.style.backgroundImage = "none";
    if (avatarText) avatarText.style.display = "block";
  }

  // 輔助函式：顯示圖片頭像
  function renderAvatarImage(base64Str) {
    if (!avatarDisplayArea) return;
    avatarDisplayArea.innerHTML = "";
    avatarDisplayArea.style.backgroundImage = `url(${base64Str})`;
    avatarDisplayArea.style.backgroundSize = "cover";
    avatarDisplayArea.style.backgroundPosition = "center";
    if (avatarText) avatarText.style.display = "none";
  }

  // ==========================================
  // 4. BMI 計算與儲存功能 (含合理性判斷)
  // ==========================================
  
  // 計算並顯示 BMI
  function calculateBMI() {
    if (!inputHeight || !inputWeight || !bmiValueEl) return;
    
    const h = parseFloat(inputHeight.value);
    const w = parseFloat(inputWeight.value);

    if (h > 0 && w > 0) {
        const heightInMeters = h / 100;
        const bmi = (w / (heightInMeters * heightInMeters)).toFixed(1);
        bmiValueEl.textContent = bmi;
        
        // 狀態判斷
        let status = "";
        let color = "#666";
        if (bmi < 18.5) { status = "(過輕)"; color = "#3b82f6"; }
        else if (bmi < 24) { status = "(正常)"; color = "#10b981"; }
        else if (bmi < 27) { status = "(過重)"; color = "#f59e0b"; }
        else { status = "(肥胖)"; color = "#ef4444"; }
        
        bmiStatusEl.textContent = status;
        bmiStatusEl.style.color = color;
    } else {
        bmiValueEl.textContent = "--";
        bmiStatusEl.textContent = "";
    }
  }

  // 監聽輸入以即時計算
  if (inputHeight) inputHeight.addEventListener("input", calculateBMI);
  if (inputWeight) inputWeight.addEventListener("input", calculateBMI);

  // 儲存按鈕事件
  if (btnSaveBody) {
    btnSaveBody.addEventListener("click", async () => {
        const h = parseFloat(inputHeight.value);
        const w = parseFloat(inputWeight.value);
        
        // 1. 基本數值檢查
        if (!h || !w || h <= 0 || w <= 0) {
            alert("請輸入有效的身高與體重！");
            return;
        }

        // 2. ★ 新增：合理範圍判斷 (避免極端值)
        if (h < 50 || h > 250) {
            alert("身高數值似乎不太合理 (50-250cm)，請確認後再試！");
            return;
        }
        if (w < 20 || w > 300) {
            alert("體重數值似乎不太合理 (20-300kg)，請確認後再試！");
            return;
        }

        // 計算 BMI
        const heightInMeters = h / 100;
        const bmiVal = w / (heightInMeters * heightInMeters);
        
        // 3. ★ 新增：BMI 異常提示
        if (bmiVal < 10 || bmiVal > 60) {
             if(!confirm(`計算出的 BMI 為 ${bmiVal.toFixed(1)}，數值似乎有些極端，確定要儲存嗎？`)) {
                 return;
             }
        }

        const bmi = bmiVal.toFixed(2);

        // 4. 更新本地
        const updates = { 
            Height: h, 
            Weight: w, 
            BMI: bmi 
        };
        updateLocalUser(updates);
        
        // 5. 更新後端
        btnSaveBody.textContent = "儲存中...";
        btnSaveBody.disabled = true;
        
        await updateServerProfile({
            height: h,
            weight: w,
            bmi: bmi
        });
        
        btnSaveBody.textContent = "更新成功！";
        setTimeout(() => {
            btnSaveBody.textContent = "更新身體數值";
            btnSaveBody.disabled = false;
        }, 2000);
    });
  }

  // ==========================================
  // 5. 其他功能 (收藏、頭像、暱稱、登出)
  // ==========================================

  // --- 收藏列表 ---
  function getColorBG(colorKey) {
    const colorBG = {
      earth: "#d4b89f", mono: "#c4c4c4", pastel: "#f9dfe5", pink: "#ffb3c6",
      red: "#e26d5a", orange: "#ffb84c", yellow: "#ffe26a", lightgreen: "#b7e4c7",
      darkgreen: "#588157", lightblue: "#a0c4ff", blue: "#4361ee", purple: "#c77dff",
      brown: "#8b5e3c",
    };
    return colorBG[colorKey] || "#e5e7eb";
  }

  function createFavoriteCardHTML(fav) {
    const bgColor = getColorBG(fav.ColorKey);
    const outfitId = fav.OutfitID;
    const imagesData = fav.OutfitImages ? JSON.stringify(fav.OutfitImages) : "null";

    return `
    <div class="idea-card" id="fav-card-${outfitId}" 
         data-id="${outfitId}"
         data-title="${fav.Title}"
         data-colorkey="${fav.ColorKey}"
         data-stylekey="${fav.StyleKey}"
         data-color="${fav.ColorLabel}"
         data-style="${fav.StyleLabel}"
         data-image="${fav.ImageURL || ''}"
         data-images='${imagesData}'
         style="cursor: pointer;">
      <button class="btn-delete-fav" data-id="${outfitId}" title="移除收藏">✕</button>
      <div class="idea-thumb" style="background-color:${bgColor}; overflow:hidden;">
        ${fav.ImageURL ? `<img src="${fav.ImageURL}" style="width:100%; height:100%; object-fit:cover;">` : ''}
      </div>
      <div class="idea-body">
        <h3 class="idea-title">${fav.Title}</h3>
        <p class="idea-tags muted small">#${fav.ColorLabel} #${fav.StyleLabel} #${fav.GenderLabel}</p>
        <p class="muted small">收藏時間：${new Date(fav.FavoritedAt).toLocaleDateString()}</p>
      </div>
    </div>`;
  }

  async function loadUserFavorites() {
    const grid = document.getElementById("fav-grid");
    if (!grid) return;
    try {
      const res = await fetch('/get-user-favorites', { credentials: 'include' });
      const data = await res.json();
      if (!data.success || data.favorites.length === 0) {
        grid.innerHTML = `<p class="muted">你尚未收藏任何 outfit</p>`;
        return;
      }
      grid.innerHTML = data.favorites.map(fav => createFavoriteCardHTML(fav)).join("");
      
      grid.addEventListener('click', async (e) => {
        const delBtn = e.target.closest('.btn-delete-fav');
        if (delBtn) {
          e.stopPropagation();
          await deleteFavorite(delBtn.dataset.id);
          return;
        }
        const card = e.target.closest('.idea-card');
        if (card) {
            const jumpData = {
                id: card.dataset.id,
                title: card.dataset.title,
                color: card.dataset.color,
                style: card.dataset.style,
                colorKey: card.dataset.colorkey,
                styleKey: card.dataset.stylekey,
                image: card.dataset.image, 
                note: `${card.dataset.color} × ${card.dataset.style} 收藏回顧`
            };
            let outfitImages = null;
            try {
                if (card.dataset.images && card.dataset.images !== "null") outfitImages = JSON.parse(card.dataset.images);
            } catch (e) {}
            if (outfitImages) jumpData.outfitImages = outfitImages;

            localStorage.setItem(RESULT_KEY, JSON.stringify(jumpData));
            setTimeout(() => window.location.href = "gallery.html", 150);
        }
      });
    } catch (err) { grid.innerHTML = `<p class="muted">載入收藏錯誤</p>`; }
  }

  async function deleteFavorite(outfitId) {
    if (!confirm("確定要移除這個收藏嗎？")) return;
    try {
      const res = await fetch('/delete-favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ outfitID: outfitId }) 
      });
      const result = await res.json();
      if (result.success) {
        const card = document.getElementById(`fav-card-${outfitId}`);
        if (card) {
          card.style.opacity = '0';
          setTimeout(() => card.remove(), 300);
        }
      } else { alert("刪除失敗"); }
    } catch (err) { alert("網路錯誤"); }
  }

  // --- 頭像與暱稱編輯 ---
  if (avatarContainer && avatarUpload) {
    avatarContainer.addEventListener("click", () => {
      if (!userJson) return alert("請先登入");
      avatarUpload.click();
    });
    avatarUpload.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) return alert("圖片太大 (限2MB)");
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64String = event.target.result;
        renderAvatarImage(base64String);
        if (btnRemoveAvatar) btnRemoveAvatar.classList.remove("hidden");
        updateLocalUser({ avatar: base64String });
        await updateServerProfile({ avatar: base64String });
      };
      reader.readAsDataURL(file);
    });
  }

  if (btnRemoveAvatar) {
    btnRemoveAvatar.addEventListener("click", async (e) => {
        e.stopPropagation();
        if(!confirm("確定要移除頭貼嗎？")) return;
        const user = JSON.parse(userJson || "{}");
        renderAvatarText(user.Username || "M");
        btnRemoveAvatar.classList.add("hidden");
        updateLocalUser({ avatar: "" });
        await updateServerProfile({ avatar: "" });
    });
  }

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
      if (!newName) return alert("暱稱不能為空");
      
      updateLocalUser({ nickname: newName, Username: newName });
      displayNickname.textContent = newName;
      nicknameEditMode.classList.add("hidden");
      nicknameViewMode.classList.remove("hidden");
      
      await updateServerProfile({ nickname: newName });
    });
  }

  // --- 共用 Helper ---
  function updateLocalUser(updates) {
    try {
      let user = JSON.parse(localStorage.getItem(USER_KEY) || "{}");
      user = { ...user, ...updates };
      // 欄位同步
      if(updates.nickname) user.Username = updates.nickname;
      if(updates.avatar !== undefined) user.Avatar = updates.avatar;
      if(updates.Height) user.Height = updates.Height;
      if(updates.Weight) user.Weight = updates.Weight;
      if(updates.BMI) user.BMI = updates.BMI;
      
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      userJson = JSON.stringify(user);

      // 同步到切換帳號列表
      let sessions = JSON.parse(localStorage.getItem(SAVED_SESSIONS_KEY) || "[]");
      const targetEmail = (user.Email || user.account || "").toLowerCase();
      const idx = sessions.findIndex(s => (s.account || s.email || "").toLowerCase() === targetEmail);
      if (idx !== -1) {
          sessions[idx] = { ...sessions[idx], ...updates };
          localStorage.setItem(SAVED_SESSIONS_KEY, JSON.stringify(sessions));
      }
    } catch(e){}
  }

  async function updateServerProfile(data) {
    try {
      const user = JSON.parse(userJson || "{}");
      if (!user.Email) return;
      await fetch(`${API_BASE_URL}/update-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: user.Email, ...data })
      });
    } catch(e) { console.error(e); }
  }

  if (btnLogout) {
    btnLogout.addEventListener("click", async () => {
      if (confirm("確定要登出嗎？")) {
        try { await fetch('/logout', { method: 'POST', credentials: 'include' }); } catch(e){}
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(ACCOUNT_KEY);
        window.location.href = "login.html";
      }
    });
  }
});
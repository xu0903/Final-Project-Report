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

  (async () => {
    userJson = await loadUserData();

    console.log("Loaded user data:", userJson);
    updateUI(userJson);
  })();

  // 登出功能

  const logoutBtn = document.getElementById("btn-logout");
  const loginLink = document.getElementById("link-login");

  if (userJson) {
    // --- 狀況 A：使用者已登入（有資料）---
    try {
      const user = JSON.parse(userJson);

      // 更新畫面文字
      if (nickNameEl) nickNameEl.textContent = user.nickname || "會員";
      if (accountEl) accountEl.textContent = user.account || ""; 

      // 顯示登出按鈕，隱藏登入連結
      if (logoutBtn) {
        logoutBtn.style.display = "inline-block";
        logoutBtn.textContent = "登出"; // 確保文字正確
      }
      if (loginLink) loginLink.style.display = "none";
    } catch (e) {
      console.error("會員資料解析失敗", e);
      // 若資料損毀，視為未登入
      localStorage.removeItem("fitmatch_user");
      window.location.reload();
    }

  } else {
    // --- 狀況 B：未登入（無資料）---
    if (nickNameEl) nickNameEl.textContent = "訪客";
    if (accountEl) accountEl.textContent = "請先登入或註冊";

    // 隱藏登出按鈕，顯示登入連結
    if (logoutBtn) logoutBtn.style.display = "none";
    if (loginLink) loginLink.style.display = "inline-block";
  }

  // 2. 實作登出功能
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      if (confirm("確定要登出嗎？")) {
        // ★ 重點：只移除「當前使用者 (fitmatch_user)」，保留「已儲存帳號 (fitmatch_saved_sessions)」
        // 這樣回到登入頁時，才能列出切換帳號的選單
        localStorage.removeItem("fitmatch_user");
        
        // 為了相容性，也移除舊的 session key (如果有用到的話)
        localStorage.removeItem("fitmatch_account");

        // 登出後跳轉回登入頁，方便使用者切換帳號
        window.location.href = "login.html";
      }
    });
  }
});
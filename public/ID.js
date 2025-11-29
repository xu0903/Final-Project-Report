document.addEventListener("DOMContentLoaded", () => {
  // 載入使用者收藏
  async function loadUserFavorites() {
    const grid = document.getElementById("fav-grid");
    if (!grid) return;

    try {
      const res = await fetch('/api/user-favorites');
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
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      if (confirm("確定要登出嗎？")) {
        // 呼叫後端登出 API 清除 cookie
        await fetch('/logout', { method: 'POST', credentials: 'include' });
        window.location.reload();
      }
    });
  }
});

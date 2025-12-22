document.addEventListener("DOMContentLoaded", () => {

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

  let userJson = null;

  (async () => {
    const freshData = await loadUserData();

    if (freshData) {
      userJson = freshData;

      try {
        const userObj = JSON.parse(freshData);
        localStorage.setItem("fitmatch_user", JSON.stringify({
          nickname: userObj.Username,
          username: userObj.Username,
          avatar: userObj.Avatar,
          email: userObj.Email,
          id: userObj.UserID
        }));
      } catch (e) { console.error("同步留言板資料錯誤", e); }
    } 
    updateUI(userJson ? JSON.parse(userJson) : null);
    loadUserProfile();
    loadUserFavorites();
  })();

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

  function loadUserProfile() {
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        const name = user.Username || user.nickname || "會員";

        // 更新文字
        if (displayNickname) displayNickname.textContent = name;
        if (displayAccount) displayAccount.textContent = user.Email || user.account || "";
        if (inputNickname) inputNickname.value = name;

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
    }
  }

  // 顯示文字頭像
  function renderAvatarText(name) {
    if (!avatarDisplayArea) return;
    const firstChar = name ? name.charAt(0).toUpperCase() : "M";
    avatarDisplayArea.innerHTML = `<span id="avatar-text" style="font-size: 2.5rem; font-weight: bold; color: #c7a693;">${firstChar}</span>`;
    avatarDisplayArea.style.backgroundImage = "none";
    if (avatarText) avatarText.style.display = "block";
  }

  // 顯示圖片頭像
  function renderAvatarImage(base64Str) {
    if (!avatarDisplayArea) return;
    avatarDisplayArea.innerHTML = "";
    avatarDisplayArea.style.backgroundImage = `url(${base64Str})`;
    avatarDisplayArea.style.backgroundSize = "cover";
    avatarDisplayArea.style.backgroundPosition = "center";
    if (avatarText) avatarText.style.display = "none";
  }

  function getColorBG(colorKey) {
    const colorBG = {
      earth: "#d4b89f", blackgraywhite: "#a2a1a1ff", pastel: "#f9dfe5", pink: "#ffb3c6",
      red: "#e26d5a", orange: "#ffb84c", yellow: "#ffe26a", lightgreen: "#b7e4c7",
      darkgreen: "#588157", lightblue: "#a0c4ff", blue: "#b7d7fcff", purple: "#c77dff",
      brown: "#c7ac91ff",
    };
    return colorBG[colorKey] || "#e5e7eb";
  }

  // 收藏卡片
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
        <p class="idea-tags muted small">
          #${fav.ColorLabel} #${fav.StyleLabel}
        </p>
        <p class="muted small">收藏時間：${new Date(fav.FavoritedAt).toLocaleDateString()}</p>
      </div>
    </div>
    `;
  }

  // 載入收藏列表
  async function loadUserFavorites() {

    const userObj = JSON.parse(userJson);

    const res = await fetch(`/api/users/${userObj.UserID}/favorite-count`);
    const data = await res.json();

    console.log(`${userObj.UserID} 收藏了 ${data.favoriteCount} 個`);

    document.getElementById("favorite-title").textContent = `我的收藏，共 ${data.favoriteCount} 個`;

    const grid = document.getElementById("fav-grid");
    if (!grid) return;

    try {
      const res = await fetch('/get-user-favorites', { credentials: 'include' });
      const data = await res.json();

      if (!data.success) {
        grid.innerHTML = `<p class="muted">無法取得收藏資料 (請確認是否登入)</p>`;
        return;
      }

      if (data.favorites.length === 0) {
        grid.innerHTML = `<p class="muted">你尚未收藏任何 outfit</p>`;
        return;
      }

      grid.innerHTML = data.favorites.map(fav => createFavoriteCardHTML(fav)).join("");

      setupCardEvents(grid);

    } catch (err) {
      console.error(err);
      grid.innerHTML = `<p class="muted">載入收藏時發生錯誤</p>`;
    }
  }

  async function refreshFavoriteCount() {
    const userObj = JSON.parse(userJson);
    const res = await fetch(`/api/users/${userObj.UserID}/favorite-count`);
    const data = await res.json();
    document.getElementById("favorite-title").textContent =
      `我的收藏，共 ${data.favoriteCount} 個`;
  }


  // 卡片跳轉與刪除
  async function setupCardEvents(grid) {
    grid.addEventListener('click', async (e) => {
      const delBtn = e.target.closest('.btn-delete-fav');
      if (delBtn) {
        e.stopPropagation();
        const favId = delBtn.dataset.id;
        await deleteFavorite(favId);
        await refreshFavoriteCount();
        return;
      }

      const card = e.target.closest('.idea-card');
      if (card) {
        document.querySelectorAll(".idea-card.active").forEach(c => c.classList.remove("active"));
        card.classList.add("active");

        const id = card.dataset.id;
        const newResult = {
          id: id,
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
          const localLook = localStorage.getItem(`fitmatch_look_${id}`);
          if (localLook) {
            outfitImages = JSON.parse(localLook);
          } else if (card.dataset.images && card.dataset.images !== "null") {
            outfitImages = JSON.parse(card.dataset.images);
          }
        } catch (e) { console.error("解析 outfitImages 錯誤", e); }

        if (outfitImages) {
          newResult.outfitImages = outfitImages;
        }

        setTimeout(() => {
          window.location.href = `gallery.html?outfitID=${id}&from=${'ID.html'}`;
        }, 150);
      }
    });
  }

  // 刪除收藏 API
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

          const grid = document.getElementById("fav-grid");
          setTimeout(() => {
            if (grid.children.length === 0) grid.innerHTML = `<p class="muted">你尚未收藏任何 outfit</p>`;
          }, 300);
        }
      } else {
        alert("刪除失敗：" + (result.message || "未知錯誤"));
      }
    } catch (err) {
      console.error("刪除錯誤", err);
      alert("網路錯誤，請稍後再試");
    }
  }

  // 頭像上傳
  if (avatarContainer && avatarUpload) {
    avatarContainer.addEventListener("click", () => {
      if (!userJson) return alert("請先登入");
      avatarUpload.click();
    });

    avatarUpload.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 20 * 1024 * 1024) return alert("圖片太大 (限20MB)");

      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64String = event.target.result;
        renderAvatarImage(base64String);
        if (btnRemoveAvatar) btnRemoveAvatar.classList.remove("hidden");

        await updateServerProfile({ avatar: base64String });
      };
      reader.readAsDataURL(file);
    });
  }

  // 移除頭像
  if (btnRemoveAvatar) {
    btnRemoveAvatar.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (!confirm("確定要移除頭貼嗎？")) return;

      const user = JSON.parse(userJson || "{}");
      const name = user.Username || user.nickname || "M";
      renderAvatarText(name);

      btnRemoveAvatar.classList.add("hidden");
      await updateServerProfile({ avatar: "" });
    });
  }

  // 編輯暱稱
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

      displayNickname.textContent = newName;
      if (avatarText && avatarText.style.display !== "none") {
        avatarText.textContent = newName.charAt(0).toUpperCase();
      }

      nicknameEditMode.classList.add("hidden");
      nicknameViewMode.classList.remove("hidden");

      await updateServerProfile({ Username: newName });
    });
  }

  // 呼叫後端
  async function updateServerProfile(data) {
    try {
      if (!userJson) {
        console.error("使用者未登入，無法更新伺服器資料");
        return false;
      }

      const response = await fetch(`/update-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        console.log("更新成功", result.user);

        userJson = JSON.stringify(result.user);
        return true;
      } else {
        console.error("更新失敗", result.message);
        return false;
      }
    } catch (err) {
      console.error("更新使用者資料錯誤", err);
      return false;
    }
  }

  // 登出
  if (btnLogout) {
    btnLogout.addEventListener("click", async () => {
      if (confirm("確定要登出嗎？")) {
        try { await fetch('/logout', { method: 'POST', credentials: 'include' }); } catch (e) { }
        window.location.href = "login.html";
      }
    });
  }

});
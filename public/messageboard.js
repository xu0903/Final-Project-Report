document.addEventListener("DOMContentLoaded", () => {

  // ===== 設定區 =====
  const USER_KEY = "fitmatch_user"; // 讀取當前登入者資料

  // ===== 變數 =====
  let messages = [];
  let likedMessageIds = new Set();
  let openedCommentIds = new Set();

  // ===== DOM 元素 =====
  const messageList = document.getElementById("message-list");
  const msgForm = document.getElementById("new-message-form");
  const msgContent = document.getElementById("content");
  const msgImageInput = document.getElementById("msg-image");
  const charCountDisplay = document.getElementById("main-char-count");
  const postingIdentity = document.getElementById("posting-as");
  const shareFavoritesBtn = document.getElementById("share-favorites-btn");

  // ===== Modal DOM =====
  const shareModal = document.getElementById("share-modal");
  const modalGrid = document.getElementById("modal-favorite-grid");
  const modalCancel = document.getElementById("modal-cancel");
  const modalConfirm = document.getElementById("modal-confirm");
  const tempFavorite = document.getElementById("tempFavorite");

  let selectedCount = document.getElementById("modal-selected-count");

  if (!selectedCount) {
    selectedCount = document.createElement("div");
    selectedCount.id = "modal-selected-count";
    selectedCount.style.marginTop = "12px";
    selectedCount.style.color = "#666";
    modalGrid.after(selectedCount);
  }
  selectedCount.textContent = "已選擇 0 / 3";

  const MAX_SELECT = 3;
  let selectedOutfits = [];

  async function loadFavoritesIntoModal() {
    selectedOutfits = [];
    updateSelectedCount();

    const res = await fetch("/get-user-favorites", { credentials: "include" });
    const data = await res.json();

    if (!data.success || !data.favorites || data.favorites.length === 0) {
      modalGrid.innerHTML = `<p class="muted">目前沒有收藏的穿搭</p>`;
      return;
    }

    modalGrid.innerHTML = data.favorites
      .map(fav => createModalFavoriteCardHTML(fav))
      .join("");

    updateSelectedCount();
  }

  modalGrid.addEventListener("click", e => {
    const card = e.target.closest(".fav-card");
    if (!card) return;

    const id = card.dataset.id;

    if (card.classList.contains("selected")) {
      card.classList.remove("selected");
      selectedOutfits = selectedOutfits.filter(x => x !== id);
    } else {
      if (selectedOutfits.length >= MAX_SELECT) {
        alert("最多選 3 套");
        return;
      }
      card.classList.add("selected");
      selectedOutfits.push(id);
    }

    updateSelectedCount();
  });

  function updateSelectedCount() {
    const el = document.getElementById("modal-selected-count");
    if (el) el.textContent = `已選擇 ${selectedOutfits.length} / ${MAX_SELECT}`;
  }



  modalCancel.addEventListener("click", () => {
    shareModal.classList.add("hidden");

    selectedOutfits = [];
    tempFavorite.innerHTML = "";
    updateSelectedCount();
  });


  modalConfirm.addEventListener("click", async () => {
    if (selectedOutfits.length === 0) {
      alert("請先選擇穿搭");
      return;
    }

    tempFavorite.innerHTML = `要分享的穿搭(favoriteID)：<br>
      ${selectedOutfits.map(id => `<div>${id}</div>`).join("")} 
    `;

    shareModal.classList.add("hidden");
  });


  function createModalFavoriteCardHTML(fav) {
    const bgColor = getColorBG(fav.ColorKey);

    return `
      <div class="fav-card" data-id="${fav.favoriteID}">
        <div class="check-badge">✓</div>

        <div class="fav-thumb" style="background:${bgColor}">
          ${fav.ImageURL
        ? `<img src="${fav.ImageURL}" style="width:100%;height:100%;object-fit:cover;">`
        : ""
      }
        </div>

        <div class="fav-body">
          <div class="fav-title">${escapeHTML(fav.Title)}</div>
          <div class="fav-tags">
            #${fav.ColorLabel} #${fav.StyleLabel}
          </div>
        </div>
      </div>
    `;
  }



  // ===== 1. 初始化 =====
  fetchMessages();
  updatePostingIdentity();

  // ===== 分享收藏 → 開啟 Modal =====
  if (shareFavoritesBtn) {
    shareFavoritesBtn.addEventListener("click", async () => {
      const user = getCurrentUser();
      if (!user) {
        alert("請先登入才能分享收藏");
        return;
      }

      selectedOutfits = [];
      shareModal.classList.remove("hidden");
      await loadFavoritesIntoModal();
    });
  }

  // 字數統計
  if (msgContent && charCountDisplay) {
    msgContent.addEventListener("input", () => {
      updateCharCount(msgContent, charCountDisplay);
    });
  }

  // ===== 2. 發布留言 =====
  if (msgForm) {
    msgForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const user = getCurrentUser();
      if (!user) {
        alert("請先登入才能留言！");
        window.location.href = "login.html";
        return;
      }

      tempFavorite.innerHTML = "";// 清空暫存收藏區

      const content = msgContent.value.trim();
      if (!content) {
        alert("請輸入內容");
        return;
      }

      try {
        const formData = new FormData();
        //新增文字內容
        formData.append("content", content);
        //新增圖片檔案(若存在)
        if (msgImageInput.files && msgImageInput.files[0]) {
          formData.append("image", msgImageInput.files[0]); // multer 接收
        }
        //新增分享的收藏穿搭(若存在)
        if (selectedOutfits.length > 0) {
          formData.append("sharedOutfits", JSON.stringify(selectedOutfits));
        }

        const res = await fetch(`/messages`, {
          method: "POST",
          body: formData,
          credentials: "include"
        });

        if (!res.ok) throw new Error("發文失敗");
        msgContent.value = "";
        msgImageInput.value = "";
        if (charCountDisplay) charCountDisplay.textContent = "0/500";
        fetchMessages(); // 重新拉取留言
      } catch (err) {
        console.error(err);
        alert("發文失敗，請稍後再試");
      }
    });
  }

  // ===== 3. 留言事件委派 =====
  if (messageList) {
    messageList.addEventListener("click", async (e) => {
      const target = e.target;

      const outfitCard = target.closest(".shared-outfit-card");
      if (outfitCard) {
        const outfitId = outfitCard.dataset.outfitId;
        window.location.href = `gallery.html?id=${outfitId}`;
        return;
      }

      const card = target.closest(".message-card");
      if (!card) return;
      const id = card.dataset.id;
      const msg = messages.find(m => m.id === id);
      if (!msg) return;

      // A. 刪除留言
      if (target.closest(".btn-delete")) {
        if (!confirm("確定要刪除這則留言嗎？")) return;
        try {
          await fetch(`/messages/${id}`, { method: "DELETE", credentials: "include" });
          fetchMessages();
        } catch (err) {
          console.error(err);
          alert("刪除失敗");
        }
        return;
      }

      // B. 留言按讚
      const likeBtn = target.closest(".btn-like");
      if (likeBtn) {
        await toggleLike("post", id);
        return;
      }

      // C. 顯示/隱藏 comment 區
      if (target.closest(".btn-comment-toggle")) {
        const commentArea = card.querySelector(".comment-area");
        if (!commentArea) return;

        const isHidden = commentArea.classList.toggle("hidden");
        if (isHidden) {
          openedCommentIds.delete(id);
        } else {
          openedCommentIds.add(id);
        }
        return;
      }

      // D. comment 區按讚
      const commentLikeBtn = target.closest(".btn-comment-like");
      if (commentLikeBtn) {
        e.stopPropagation(); // ⭐ 關鍵
        const commentItem = target.closest(".comment-item");
        const commentId = commentItem.dataset.commentId;
        await toggleLike("comment", id, commentId);
        return;
      }

      // E. 刪除 comment
      const commentDelBtn = target.closest(".btn-comment-delete");
      if (commentDelBtn) {
        const commentItem = target.closest(".comment-item");
        const commentId = commentItem.dataset.commentId;
        if (!confirm("確定刪除此評論？")) return;
        try {
          await fetch(`/messages/${id}/comment/${commentId}`, { method: "DELETE", credentials: "include" });
          fetchMessages();
        } catch (err) {
          console.error(err);
        }
        return;
      }
    });

    // F. comment 送出
    messageList.addEventListener("submit", async (e) => {
      if (!e.target.classList.contains("comment-form")) return;
      e.preventDefault();
      const form = e.target;
      const card = form.closest(".message-card");
      const id = card.dataset.id;
      const content = form.commentContent.value.trim();
      if (!content) return;

      try {
        await fetch(`/messages/${id}/comment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
          credentials: "include"
        });
        form.commentContent.value = "";
        fetchMessages();
      } catch (err) {
        console.error(err);
      }
    });

    // G. comment 字數統計
    messageList.addEventListener("input", (e) => {
      if (e.target.name === "commentContent") {
        const wrapper = e.target.closest(".input-wrapper");
        const countDisplay = wrapper.querySelector(".comment-char-count");
        if (countDisplay) updateCharCount(e.target, countDisplay);
      }
    });
  }

  // ===== 4. 渲染留言 =====
  function renderMessages() {
    if (!messageList) return;
    if (messages.length === 0) {
      messageList.innerHTML = `<div class="muted" style="text-align:center; padding:30px;">目前沒有留言，來搶頭香吧！</div>`;
      return;
    }

    messageList.innerHTML = messages.map(msg => {
      console.log("處理留言 ID =", msg.id);
      console.log('sharedOutfits:', msg.sharedOutfits);
      const isOpen = openedCommentIds.has(msg.id);
      const avatarHTML = createAvatarHTML(msg.nickname, msg.userAvatar);
      const imgHTML = msg.image ? `<div class="message-media"><img src="${msg.image}" class="message-img"></div>` : "";
      const isLiked = msg.likedByCurrentUser;

      const sharedCardsHTML =
        (msg.sharedCards && msg.sharedCards.length > 0)
          ? `
            <div class="shared-cards-grid">
              ${msg.sharedCards.map(fav =>
            createSharedFavoriteCardHTML(fav)
          ).join("")}
            </div>
          `
          : "";



      const commentsHTML = (msg.comments || []).map(com => {
        const comAvatar = createAvatarHTML(com.nickname, com.userAvatar);

        return `
          <li class="comment-item" data-comment-id="${com.id}">
            <div class="comment-header">
              <div style="display:flex; align-items:center; gap:8px;">
                  ${comAvatar}
                  <span class="comment-nickname">${escapeHTML(com.nickname)}</span>
              </div>
              <div class="comment-meta">
                 <button type="button" class="btn-comment-like ${com.likedByCurrentUser ? 'liked' : ''}">
                   ${com.likedByCurrentUser ? '❤️' : '🤍'} ${com.likes || 0}
                 </button>
                 <span class="comment-time">${formatTime(com.createdAt)}</span>
                 <button type="button" class="btn-icon btn-comment-delete">🗑️</button>
              </div>
            </div>
            <p class="comment-content" style="margin-left: 48px;">${escapeHTML(com.content)}</p>
          </li>
        `;
      }).join("");

      return `
        <article class="message-card" data-id="${msg.id}">
          <div class="message-header">
            ${avatarHTML}
            <div class="msg-info">
              <span class="message-nickname">${escapeHTML(msg.nickname)}</span>
              <span class="message-time">${formatTime(msg.createdAt)}</span>
            </div>
          </div>
          
          <div class="message-content">
            ${escapeHTML(msg.content).replace(/\n/g, "<br>")}
          </div>
          ${sharedCardsHTML}
          ${imgHTML}
          <!-- 分享收藏穿搭卡片生成區塊(目前先用文字代替) -->
          <div class="shared-outfits-container">
            ${msg.sharedOutfits && msg.sharedOutfits.length > 0
                    ? msg.sharedOutfits.slice(0, 3).map(outfit => `
                  <div class="shared-outfit-placeholder" style="border: 1px solid #ddd; padding: 8px; margin-bottom: 5px; border-radius: 5px;">
                    <strong>${outfit.title || '未命名穿搭'}</strong><br>
                    <small>${outfit.styleLabel} / ${outfit.colorLabel}</small>
                  </div>
                `).join('')
                    : ''
              }
          </div>

          <div class="message-actions">
            <button class="btn-text btn-like ${isLiked ? 'liked' : ''}">
               ${isLiked ? '💖' : '🤍'} <span class="like-count">${msg.likes || 0}</span>
            </button>
            <button class="btn-text btn-comment-toggle">💬 評論 (${(msg.comments || []).length})</button>
            <button class="btn-icon btn-delete">🗑️</button>
          </div>

          <div class="comment-area ${isOpen ? '' : 'hidden'}">
             <form class="comment-form">
               <div class="input-wrapper">
                 <textarea name="commentContent" rows="5" placeholder="寫下你的評論..." maxlength="500" required></textarea>
                 <span class="char-count comment-char-count">0/500</span>
               </div>
               <button type="submit" class="btn small" style="margin-top:5px;">送出</button>
             </form>
             <ul class="comment-list">
               ${commentsHTML}
             </ul>
          </div>
        </article>
      `;
    }).join("");
  }

  // ===== 5. Helper 函式 =====
  function createAvatarHTML(name, base64) {
    if (base64) return `<div class="msg-avatar" style="background-image: url('${base64}');"></div>`;
    const char = (name || "?").charAt(0).toUpperCase();
    return `<div class="msg-avatar">${char}</div>`;
  }

  function getCurrentUser() {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); }
    catch (e) { return null; }
  }

  function updatePostingIdentity() {
    if (!postingIdentity) return;
    const user = getCurrentUser();
    if (user) postingIdentity.innerHTML = `正在以 <strong>${escapeHTML(user.nickname || user.username || "會員")}</strong> 的身分發文`;
    else postingIdentity.innerHTML = `<a href="login.html" style="color:#c7a693;">請先登入</a>`;
  }

  function updateCharCount(input, display) {
    display.textContent = `${input.value.length}/${input.getAttribute("maxlength")}`;
  }

  function createSharedFavoriteCardHTML(fav) {
    const bgColor = getColorBG(fav.ColorKey);
    const outfitId = fav.OutfitID;

    return `
      <div class="idea-card shared-outfit-card"
          data-outfit-id="${outfitId}"
          style="cursor:pointer;">

        <div class="idea-thumb" style="background-color:${bgColor}; overflow:hidden;">
          ${fav.ImageURL
        ? `<img src="${fav.ImageURL}" style="width:100%; height:100%; object-fit:cover;">`
        : ''
      }
        </div>

        <div class="idea-body">
          <h3 class="idea-title">${escapeHTML(fav.Title)}</h3>
          <p class="idea-tags muted small">
            #${fav.ColorLabel} #${fav.StyleLabel}
          </p>
          <p class="muted small">
            收藏時間：${new Date(fav.FavoritedAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    `;
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

  function escapeHTML(str) {
    if (!str) return "";
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function formatTime(isoString) {
    if (!isoString) return "";
    const d = new Date(isoString);
    return d.toLocaleString('zh-TW', { hour12: false, month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  async function fetchMessages() {
    try {
      const res = await fetch(`/messages`, { credentials: "include" });
      if (!res.ok) throw new Error("讀取留言失敗");
      messages = await res.json(); // 後端返回已排序好、每則留言包含 comments、likes
      console.log("取得留言：", messages);
      renderMessages();
    } catch (err) {
      console.error(err);
      messageList.innerHTML = `<div class="muted" style="text-align:center; padding:30px;">無法載入留言</div>`;
    }
  }

  // 切換貼文或評論的按讚狀態，由後端判斷是 like 還是 unlike
  async function toggleLike(type, postId, commentId = null) {
    const user = getCurrentUser();
    if (!user) {
      alert("請先登入才能操作！");
      return;
    }

    try {
      let url = "";
      let method = "POST";

      if (type === "post") {
        url = `/messages/${postId}/toggle-like`;
      } else if (type === "comment") {
        url = `/messages/${postId}/comment/${commentId}/toggle-like`;
      }

      const res = await fetch(url, { method, credentials: "include" });
      if (!res.ok) throw new Error("操作失敗");

      // 重新拉取留言更新 UI
      await fetchMessages();
    } catch (err) {
      console.error(err);
    }
  }

});



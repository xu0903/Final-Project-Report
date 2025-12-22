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
    if (modalGrid) modalGrid.after(selectedCount);
  }
  if (selectedCount) selectedCount.textContent = "已選擇 0 / 3";

  const MAX_SELECT = 3;
  let selectedOutfits = [];

  // 載入收藏到 Modal
  async function loadFavoritesIntoModal() {
    selectedOutfits = [];
    updateSelectedCount();

    try {
      const res = await fetch("/get-user-favorites", { credentials: "include" });
      const data = await res.json();

      if (!data.success || !data.favorites || data.favorites.length === 0) {
        modalGrid.innerHTML = `<p class="muted">目前沒有收藏的穿搭</p>`;
        return;
      }

      modalGrid.innerHTML = data.favorites
        .map(fav => createSharedFavoriteCardHTML(fav))
        .join("");
    } catch (e) {
      console.error(e);
      modalGrid.innerHTML = `<p class="muted">無法載入收藏</p>`;
    }
    updateSelectedCount();
  }

  if (modalGrid) {
    modalGrid.addEventListener("click", e => {
      const card = e.target.closest(".fav-card, .shared-outfit-card");
      if (!card) return;

      // ★★★ 修正這裡：發文時，我們要傳給後端的是 "FavoriteID" ★★★
      // 原本是 card.dataset.outfitId，現在改為 dataset.favoriteId
      const id = card.dataset.favoriteId; 

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
  }

  function updateSelectedCount() {
    const el = document.getElementById("modal-selected-count");
    if (el) el.textContent = `已選擇 ${selectedOutfits.length} / ${MAX_SELECT}`;
  }

  if (modalCancel) {
    modalCancel.addEventListener("click", () => {
      shareModal.classList.add("hidden");
      selectedOutfits = [];
      if (tempFavorite) tempFavorite.innerHTML = "";
      updateSelectedCount();
    });
  }

  if (modalConfirm) {
    modalConfirm.addEventListener("click", async () => {
      if (selectedOutfits.length === 0) {
        alert("請先選擇穿搭");
        return;
      }
      if (tempFavorite) {
        tempFavorite.innerHTML = `準備分享 ${selectedOutfits.length} 套穿搭`;
        tempFavorite.style.color = "#4a90e2";
        tempFavorite.style.marginTop = "10px";
      }
      shareModal.classList.add("hidden");
    });
  }

  // ★★★ 核心修正 1：共用的小卡生成函式 ★★★
  // ★★★ 核心修正：共用的小卡生成函式 ★★★
  function createSharedFavoriteCardHTML(fav) {
    // 1. 抓取 OutfitID (給點擊跳轉 gallery 用)
    const outfitId = fav.outfitId || fav.OutfitID;
    
    // 2. ★ 新增：抓取 FavoriteID (給發文傳後端用)
    // Modal 來源是 FavoriteID (大寫)，留言板來源是 favoriteId (小寫)
    const favId = fav.favoriteId || fav.FavoriteID || fav.favoriteID; 

    const title = fav.title || fav.Title;
    const img = fav.imageURL || fav.ImageURL || fav.ImageTop || ""; 
    const cKey = fav.colorKey || fav.ColorKey;
    const cLabel = fav.colorLabel || fav.ColorLabel;
    const sLabel = fav.styleLabel || fav.StyleLabel;
    const favTime = fav.favoritedAt || fav.FavoritedAt;
    const bgColor = getColorBG(cKey);

    let dateString = "推薦穿搭";
    if (favTime) {
         dateString = `收藏時間：${new Date(favTime).toLocaleDateString()}`;
    }

    // ★ 注意：在 div 上新增了 data-favorite-id
    return `
      <div class="idea-card shared-outfit-card fav-card"
           data-outfit-id="${outfitId}" 
           data-favorite-id="${favId}" 
           style="cursor:pointer;">

        <div class="idea-thumb" style="background-color:${bgColor}; overflow:hidden;">
          ${img
            ? `<img src="${img}" style="width:100%; height:100%; object-fit:cover;">`
            : ''
          }
        </div>

        <div class="idea-body">
          <h3 class="idea-title">${escapeHTML(title)}</h3>
          <p class="idea-tags muted small">
            #${escapeHTML(cLabel)} #${escapeHTML(sLabel)}
          </p>
          <p class="muted small">
             ${dateString}
          </p>
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

      if (tempFavorite) tempFavorite.innerHTML = "";

      const content = msgContent.value.trim();
      if (!content) {
        alert("請輸入內容");
        return;
      }

      try {
        const formData = new FormData();
        formData.append("content", content);
        if (msgImageInput.files && msgImageInput.files[0]) {
          formData.append("image", msgImageInput.files[0]);
        }
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
        selectedOutfits = []; 
        if (charCountDisplay) charCountDisplay.textContent = "0/500";
        fetchMessages();
      } catch (err) {
        console.error(err);
        alert("發文失敗，請稍後再試");
      }
    });
  }

  // ===== 3. 留言事件委派 (含卡片點擊邏輯) =====
  if (messageList) {
    messageList.addEventListener("click", async (e) => {
      const target = e.target;

      // ★★★ 核心修正 2：參考 ID.js 的跳轉邏輯 ★★★
      const outfitCard = target.closest(".shared-outfit-card");
      // 排除在 modal 裡面的點擊，只針對留言區的卡片
      if (outfitCard && !target.closest("#modal-favorite-grid")) {
        const outfitId = outfitCard.dataset.outfitId;
        
        // 模仿 ID.js 加入一點延遲，並使用正確的參數名稱 outfitID
        setTimeout(() => {
            window.location.href = `gallery.html?outfitID=${outfitId}&from=messageboard.html`;
        }, 150);
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
        e.stopPropagation();
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
  // ===== 4. 渲染留言 (修正後：讀取後端 isLiked 狀態) =====
// ===== 4. 渲染留言 (已加入 # @ 變色功能) =====
  function renderMessages() {
    if (!messageList) return;
    if (messages.length === 0) {
      messageList.innerHTML = `<div class="muted" style="text-align:center; padding:30px;">目前沒有留言，來搶頭香吧！</div>`;
      return;
    }

    messageList.innerHTML = messages.map(msg => {
      const isOpen = openedCommentIds.has(msg.id);
      const avatarHTML = createAvatarHTML(msg.nickname, msg.userAvatar);
      const imgHTML = msg.image ? `<div class="message-media"><img src="${msg.image}" class="message-img"></div>` : "";
      
      const isLiked = msg.isLiked; 

      const sharedCardsHTML =
        (msg.sharedOutfits && msg.sharedOutfits.length > 0)
          ? `
            <div class="shared-cards-grid">
              ${msg.sharedOutfits.map(fav =>
                createSharedFavoriteCardHTML(fav)
              ).join("")}
            </div>
          `
          : "";

      const commentsHTML = (msg.comments || []).map(com => {
        const comAvatar = createAvatarHTML(com.nickname, com.userAvatar);
        const isCommentLiked = com.isLiked;

        return `
          <li class="comment-item" data-comment-id="${com.id}" style="margin-top: 12px; padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
            <div class="comment-header" style="display:flex; align-items:center; gap:12px; margin-bottom:6px;">
               ${comAvatar}
               <div class="comment-info" style="display:flex; flex-direction:column; line-height:1.3;">
                  <span class="comment-nickname" style="font-weight:700; font-size:0.9rem; color:#333;">${escapeHTML(com.nickname)}</span>
                  <span class="comment-time" style="font-size:0.75rem; color:#999;">${formatTime(com.createdAt)}</span>
               </div>
            </div>
            <div class="comment-content" style="margin-left:52px; margin-bottom:8px; font-size:0.9rem; color:#333;">
               ${formatMessageContent(com.content)}
            </div>
            <div class="comment-actions" style="margin-left:52px; display:flex; gap:16px; align-items:center;">
               <button type="button" class="btn-text btn-comment-like ${isCommentLiked ? 'liked' : ''}" style="display:inline-flex; align-items:center; gap:4px; border:none; background:none; cursor:pointer; color:#6b7280; transition: transform 0.15s;">
                 ${isCommentLiked ? '❤️' : '🤍'} <span class="like-count" style="font-size:0.85rem;">${com.likes || 0}</span>
               </button>
               <button type="button" class="btn-icon btn-comment-delete" style="border:none; background:none; cursor:pointer; font-size:0.9rem; color:#6b7280;">🗑️</button>
            </div>
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
            ${formatMessageContent(msg.content)}
          </div>

          ${sharedCardsHTML}
          ${imgHTML}

          <div class="message-actions">
            <button class="btn-text btn-like ${isLiked ? 'liked' : ''}">
              ${isLiked ? '❤️' : '🤍'} <span class="like-count">${msg.likes || 0}</span>
            </button>
            <button class="btn-text btn-comment-toggle">💬 評論 (${(msg.comments || []).length})</button>
            <button class="btn-icon btn-delete">🗑️</button>
          </div>

          <div class="comment-area ${isOpen ? '' : 'hidden'}">
             <form class="comment-form">
               <div class="input-wrapper">
                 <textarea name="commentContent" rows="3" placeholder="寫下你的評論..." maxlength="500" required></textarea>
                 <span class="char-count comment-char-count">0/500</span>
               </div>
               <button type="submit" class="btn small" style="margin-top:5px;">送出</button>
             </form>
             <ul class="comment-list" style="list-style:none; padding:0; margin-top:10px;">
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
      messages = await res.json();
      console.log("取得留言：", messages);
      renderMessages();
    } catch (err) {
      console.error(err);
      messageList.innerHTML = `<div class="muted" style="text-align:center; padding:30px;">無法載入留言</div>`;
    }
  }


  async function toggleLike(type, postId, commentId = null) {
    const user = getCurrentUser();
    if (!user) {
      alert("請先登入才能操作！");
      return;
    }

    try {
      let url = "";
      let btnSelector = null;
      let countSelector = null;

      // 1. 設定 URL 與 DOM 選擇器 (先找到要操作的元素)
      if (type === "post") {
        url = `/messages/${postId}/toggle-like`;
        const card = document.querySelector(`.message-card[data-id="${postId}"]`);
        if (card) {
          btnSelector = card.querySelector(".btn-like");
          countSelector = card.querySelector(".like-count");
        }
      } else if (type === "comment") {
        url = `/messages/${postId}/comment/${commentId}/toggle-like`;
        const item = document.querySelector(`.comment-item[data-comment-id="${commentId}"]`);
        if (item) {
          btnSelector = item.querySelector(".btn-comment-like");
          countSelector = item.querySelector(".like-count");
        }
      }

      // 2. 發送請求給後端 (這是關鍵：先請求，此時畫面尚未變色)
      const res = await fetch(url, { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error("操作失敗");

      // 3. 等待後端回傳結果 (Server 決定是 liked: true 還是 false)
      const data = await res.json(); 

      // 4. 只有在後端成功回傳後，才修改畫面 (數字與顏色)
      if (btnSelector && countSelector) {
        let currentCount = parseInt(countSelector.textContent) || 0;

        if (data.liked) {

          if (!btnSelector.classList.contains("liked")) {
             currentCount++; 
          }
          btnSelector.classList.add("liked");
          btnSelector.innerHTML = `❤️ <span class="like-count">${currentCount}</span>`;
        } else {
          if (btnSelector.classList.contains("liked")) {
             currentCount = Math.max(0, currentCount - 1); 
          }
          btnSelector.classList.remove("liked");
          btnSelector.innerHTML = `🤍 <span class="like-count">${currentCount}</span>`;
        }
      }

    } catch (err) {
      console.error(err);
      alert("操作失敗，請稍後再試");
    }
  }

  // ===== 專門處理留言內容的函式 (防XSS + 標籤變色 + 換行) =====
  function formatMessageContent(str) {
    if (!str) return "";

    // 1. 先做 HTML 跳脫 (防止 XSS 攻擊)
    let safeStr = str.replace(/&/g, "&amp;")
                     .replace(/</g, "&lt;")
                     .replace(/>/g, "&gt;")
                     .replace(/"/g, "&quot;");

    // 2. 針對 # 和 @ 進行變色處理
    // 正規表達式說明：
    // (#|@)           -> 抓取 # 或 @
    // ([\w\u4e00-\u9fa5]+) -> 抓取後面的 英文、數字、底線 或 中文字
    safeStr = safeStr.replace(/(#|@)([\w\u4e00-\u9fa5]+)/g, (match) => {
      return `<span class="highlight-text">${match}</span>`;
    });

    // 3. 處理換行 (\n 轉 <br>)
    return safeStr.replace(/\n/g, "<br>");
  }

});
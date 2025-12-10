document.addEventListener("DOMContentLoaded", () => {
  // ===== 設定區 =====
  const API_BASE = "http://localhost:3000/api"; // 後端 API base URL
  const USER_KEY = "fitmatch_user"; // 讀取當前登入者資料

  // ===== 變數 =====
  let messages = [];
  let likedMessageIds = new Set();

  // ===== DOM 元素 =====
  const messageList = document.getElementById("message-list");
  const msgForm = document.getElementById("new-message-form");
  const msgContent = document.getElementById("content");
  const msgImageInput = document.getElementById("msg-image");
  const charCountDisplay = document.getElementById("main-char-count");
  const postingIdentity = document.getElementById("posting-as");

  // ===== 1. 初始化 =====
  fetchMessages();
  updatePostingIdentity();

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

      const content = msgContent.value.trim();
      if (!content) {
        alert("請輸入內容");
        return;
      }

      try {
        const formData = new FormData();
        formData.append("content", content);
        if (msgImageInput.files && msgImageInput.files[0]) {
          formData.append("image", msgImageInput.files[0]); // multer 接收
        }

        const res = await fetch(`${API_BASE}/messages`, {
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
      const card = target.closest(".message-card");
      if (!card) return;
      const id = card.dataset.id;
      const msg = messages.find(m => m.id === id);
      if (!msg) return;

      // A. 刪除留言
      if (target.closest(".btn-delete")) {
        if (!confirm("確定要刪除這則留言嗎？")) return;
        try {
          await fetch(`${API_BASE}/messages/${id}`, { method: "DELETE", credentials: "include" });
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
        if (commentArea) commentArea.classList.toggle("hidden");
        return;
      }

      // D. comment 區按讚
      const commentLikeBtn = target.closest(".btn-comment-like");
      if (commentLikeBtn) {
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
          await fetch(`${API_BASE}/messages/${id}/comment/${commentId}`, { method: "DELETE", credentials: "include" });
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
        await fetch(`${API_BASE}/messages/${id}/comment`, {
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
      const avatarHTML = createAvatarHTML(msg.nickname, msg.userAvatar);
      const imgHTML = msg.image ? `<div class="message-media"><img src="${msg.image}" class="message-img"></div>` : "";
      const isLiked = msg.likedByCurrentUser;

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
                   ${com.likedByCurrentUser ? '❤️' : '♡'} ${com.likes || 0}
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
          ${imgHTML}

          <div class="message-actions">
            <button class="btn-text btn-like ${isLiked ? 'liked' : ''}">
               ${isLiked ? '💖' : '🤍'} <span class="like-count">${msg.likes || 0}</span>
            </button>
            <button class="btn-text btn-comment-toggle">💬 評論 (${(msg.comments || []).length})</button>
            <button class="btn-icon btn-delete">🗑️</button>
          </div>

          <div class="comment-area hidden">
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
      const res = await fetch(`${API_BASE}/messages`, { credentials: "include" });
      if (!res.ok) throw new Error("讀取留言失敗");
      messages = await res.json(); // 後端返回已排序好、每則留言包含 comments、likes
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
        url = `${API_BASE}/messages/${postId}/toggle-like`; 
      } else if (type === "comment") {
        url = `${API_BASE}/messages/${postId}/comment/${commentId}/toggle-like`;
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
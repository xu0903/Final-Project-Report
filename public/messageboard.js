document.addEventListener("DOMContentLoaded", () => {
  // ===== 設定區 =====
  const STORAGE_KEY = "fitmatch_messageboard";
  const LIKE_STORAGE_KEY = "fitmatch_message_likes"; 
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
  loadMessages();
  loadLikes();
  renderMessages();
  updatePostingIdentity();

  // 監聽字數輸入
  if (msgContent && charCountDisplay) {
    msgContent.addEventListener("input", () => {
      updateCharCount(msgContent, charCountDisplay);
    });
  }

  // ===== 2. 發布留言功能 =====
  if (msgForm) {
    msgForm.addEventListener("submit", (e) => {
      e.preventDefault();
      
      // 1. 檢查登入
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

      // 2. 處理圖片與發文
      const processPost = (imgBase64) => {
        const newMessage = {
          id: Date.now().toString(), // 使用 String ID 避免大數問題
          nickname: user.nickname || user.username || "會員",
          userAvatar: user.avatar || null, // 記錄當下的頭像
          content: content,
          image: imgBase64 || null,
          createdAt: new Date().toISOString(),
          likes: 0,
          replies: []
        };

        messages.unshift(newMessage); // 加在最前面
        saveMessages();
        renderMessages();

        // 重置表單
        msgContent.value = "";
        msgImageInput.value = "";
        if(charCountDisplay) charCountDisplay.textContent = "0/500";
      };

      // 讀取圖片 (如果有)
      if (msgImageInput.files && msgImageInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(evt) {
           processPost(evt.target.result);
        };
        reader.readAsDataURL(msgImageInput.files[0]);
      } else {
        processPost(null);
      }
    });
  }

  // ===== 3. 事件委派 (Event Delegation) - 核心邏輯 =====
  // 這裡整合了所有按鈕的監聽：刪除、按讚、回覆切換、送出回覆
  if (messageList) {
    messageList.addEventListener("click", (e) => {
      const target = e.target;
      const card = target.closest(".message-card");
      if (!card) return;
      const id = card.dataset.id;
      const msg = messages.find(m => m.id === id);
      
      if (!msg) return;

      // A. 刪除主留言
      if (target.closest(".btn-delete")) {
        if (confirm("確定要刪除這則留言嗎？")) {
          messages = messages.filter(m => m.id !== id);
          // 清理 Like 紀錄
          likedMessageIds.delete(id);
          if(msg.replies) msg.replies.forEach(r => likedMessageIds.delete(r.id));
          
          saveMessages();
          saveLikes();
          renderMessages();
        }
        return;
      }

      // B. 主留言按讚
      const likeBtn = target.closest(".btn-like");
      if (likeBtn) {
        if (likedMessageIds.has(id)) {
          msg.likes = Math.max((msg.likes || 0) - 1, 0);
          likedMessageIds.delete(id);
        } else {
          msg.likes = (msg.likes || 0) + 1;
          likedMessageIds.add(id);
        }
        saveMessages();
        saveLikes();
        renderMessages(); // 重新渲染更新愛心狀態
        return;
      }

      // C. 顯示/隱藏回覆區
      if (target.closest(".btn-reply-toggle")) {
        const replyArea = card.querySelector(".reply-area");
        if (replyArea) replyArea.classList.toggle("hidden");
        return;
      }

      // D. 回覆區按讚
      const replyLikeBtn = target.closest(".btn-reply-like");
      if (replyLikeBtn) {
        const replyItem = target.closest(".reply-item");
        const replyId = replyItem.dataset.replyId;
        const reply = msg.replies.find(r => r.id === replyId);
        
        if (reply) {
            if (likedMessageIds.has(replyId)) {
                reply.likes = Math.max((reply.likes || 0) - 1, 0);
                likedMessageIds.delete(replyId);
            } else {
                reply.likes = (reply.likes || 0) + 1;
                likedMessageIds.add(replyId);
            }
            saveMessages();
            saveLikes();
            renderMessages();
            // 保持回覆區開啟
            const newCard = document.querySelector(`.message-card[data-id="${id}"]`);
            if(newCard) newCard.querySelector(".reply-area").classList.remove("hidden");
        }
        return;
      }

      // E. 刪除回覆
      if (target.closest(".btn-reply-delete")) {
        const replyItem = target.closest(".reply-item");
        const replyId = replyItem.dataset.replyId;
        
        if (confirm("確定刪除此回覆？")) {
            msg.replies = msg.replies.filter(r => r.id !== replyId);
            likedMessageIds.delete(replyId);
            saveMessages();
            saveLikes();
            renderMessages();
            // 保持回覆區開啟
            const newCard = document.querySelector(`.message-card[data-id="${id}"]`);
            if(newCard) newCard.querySelector(".reply-area").classList.remove("hidden");
        }
        return;
      }
    });

    // F. 監聽回覆表單送出 (Submit 事件不能用 click 委派，要用 submit 委派)
    messageList.addEventListener("submit", (e) => {
      if (e.target.classList.contains("reply-form")) {
        e.preventDefault();
        
        const user = getCurrentUser();
        if (!user) {
            alert("請先登入才能回覆！");
            return;
        }

        const form = e.target;
        const card = form.closest(".message-card");
        const id = card.dataset.id;
        const msg = messages.find(m => m.id === id);
        
        const content = form.replyContent.value.trim();
        if (!content) return;

        const newReply = {
            id: Date.now().toString(),
            nickname: user.nickname || "會員",
            userAvatar: user.avatar || null,
            content: content,
            createdAt: new Date().toISOString(),
            likes: 0
        };

        if (!msg.replies) msg.replies = [];
        msg.replies.push(newReply);
        
        saveMessages();
        renderMessages();
        
        // 保持開啟
        const newCard = document.querySelector(`.message-card[data-id="${id}"]`);
        if(newCard) newCard.querySelector(".reply-area").classList.remove("hidden");
      }
    });

    // G. 監聽回覆輸入框字數
    messageList.addEventListener("input", (e) => {
        if(e.target.name === "replyContent") {
            const wrapper = e.target.closest(".input-wrapper");
            const countDisplay = wrapper.querySelector(".reply-char-count");
            if(countDisplay) updateCharCount(e.target, countDisplay);
        }
    });
  }

  // ===== 4. 渲染函式 (UI 生成) =====
  function renderMessages() {
    if (!messageList) return;

    if (messages.length === 0) {
      messageList.innerHTML = `<div class="muted" style="text-align:center; padding:30px;">目前沒有留言，來搶頭香吧！</div>`;
      return;
    }

    messageList.innerHTML = messages.map(msg => {
      // 處理頭像 HTML
      const avatarHTML = createAvatarHTML(msg.nickname, msg.userAvatar);
      const isLiked = likedMessageIds.has(msg.id);
      
      // 圖片 HTML
      const imgHTML = msg.image ? 
        `<div class="message-media"><img src="${msg.image}" class="message-img"></div>` : "";

      // 回覆 HTML
      const repliesHTML = (msg.replies || []).map(rep => {
          const isRepLiked = likedMessageIds.has(rep.id);
          const repAvatar = createAvatarHTML(rep.nickname, rep.userAvatar);
          return `
            <li class="reply-item" data-reply-id="${rep.id}">
              <div class="reply-header">
                <div style="display:flex; align-items:center; gap:8px;">
                    ${repAvatar}
                    <span class="reply-nickname">${escapeHTML(rep.nickname)}</span>
                </div>
                <div class="reply-meta">
                   <button type="button" class="btn-reply-like ${isRepLiked ? 'liked' : ''}">
                     ${isRepLiked ? '❤️' : '♡'} ${rep.likes||0}
                   </button>
                   <span class="reply-time">${formatTime(rep.createdAt)}</span>
                   <button type="button" class="btn-icon btn-reply-delete">🗑️</button>
                </div>
              </div>
              <p class="reply-content" style="margin-left: 48px;">${escapeHTML(rep.content)}</p>
            </li>
          `;
      }).join("");

      // 主卡片 HTML (Threads 風格: 頭像在左，資訊並排)
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
               ${isLiked ? '💖' : '🤍'} <span class="like-count">${msg.likes||0}</span>
            </button>
            <button class="btn-text btn-reply-toggle">💬 回覆 (${(msg.replies||[]).length})</button>
            <button class="btn-icon btn-delete">🗑️</button>
          </div>

          <!-- 回覆區塊 (預設隱藏) -->
          <div class="reply-area hidden">
             <form class="reply-form">
               <div class="input-wrapper">
                 <textarea name="replyContent" rows="1" placeholder="寫下你的回覆..." maxlength="500" required></textarea>
                 <span class="char-count reply-char-count">0/500</span>
               </div>
               <button type="submit" class="btn small" style="margin-top:5px;">送出</button>
             </form>
             <ul class="reply-list">
               ${repliesHTML}
             </ul>
          </div>
        </article>
      `;
    }).join("");
  }

  // ===== 5. Helper 函式 =====
  
  function createAvatarHTML(name, base64) {
      if (base64) {
          return `<div class="msg-avatar" style="background-image: url('${base64}');"></div>`;
      } else {
          const char = (name || "?").charAt(0).toUpperCase();
          return `<div class="msg-avatar">${char}</div>`;
      }
  }

  function getCurrentUser() {
      try {
          return JSON.parse(localStorage.getItem(USER_KEY));
      } catch(e) { return null; }
  }

  function updatePostingIdentity() {
      if (!postingIdentity) return;
      const user = getCurrentUser();
      if (user) {
          const name = user.nickname || user.username || "會員";
          postingIdentity.innerHTML = `正在以 <strong>${escapeHTML(name)}</strong> 的身分發文`;
      } else {
          postingIdentity.innerHTML = `<a href="login.html" style="color:#c7a693;">請先登入</a>`;
      }
  }

  function loadMessages() {
    try {
      messages = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch (e) { messages = []; }
  }

  function saveMessages() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }

  function loadLikes() {
    try {
      likedMessageIds = new Set(JSON.parse(localStorage.getItem(LIKE_STORAGE_KEY) || "[]"));
    } catch (e) { likedMessageIds = new Set(); }
  }

  function saveLikes() {
    localStorage.setItem(LIKE_STORAGE_KEY, JSON.stringify([...likedMessageIds]));
  }

  function escapeHTML(str) {
    if(!str) return "";
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function formatTime(isoString) {
    if(!isoString) return "";
    const d = new Date(isoString);
    return d.toLocaleString('zh-TW', { hour12: false, month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit' });
  }

  function updateCharCount(input, display) {
    display.textContent = `${input.value.length}/${input.getAttribute("maxlength")}`;
  }
});
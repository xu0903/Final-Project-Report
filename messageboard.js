// messageboard.js

const STORAGE_KEY = "fitmatch_messageboard";
const LIKE_STORAGE_KEY = "fitmatch_message_likes"; // 記錄已按讚的留言/回覆 ID
let messages = [];
let likedMessageIds = new Set(); // 存放已按讚的 ID (包含留言與回覆)

// 安全轉義，避免 XSS
function escapeHTML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatTime(isoString) {
  const date = new Date(isoString);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${y}/${m}/${d} ${hh}:${mm}`;
}

function loadMessages() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    messages = raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("載入留言失敗", e);
    messages = [];
  }
}

function saveMessages() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
}

// 讀取已按愛心的 ID
function loadLikes() {
  try {
    const raw = localStorage.getItem(LIKE_STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    likedMessageIds = new Set(arr);
  } catch (e) {
    console.error("載入按讚紀錄失敗", e);
    likedMessageIds = new Set();
  }
}

// 存回已按愛心的 ID
function saveLikes() {
  localStorage.setItem(LIKE_STORAGE_KEY, JSON.stringify([...likedMessageIds]));
}

// ★ 更新字數計數器工具函數
function updateCharCount(inputElement, displayElement) {
  const currentLength = inputElement.value.length;
  const maxLength = inputElement.getAttribute("maxlength") || 500;
  displayElement.textContent = `${currentLength}/${maxLength}`;
}

function createMessageHTML(msg) {
  const nickname = msg.nickname?.trim() || "匿名";
  const contentHTML = escapeHTML(msg.content).replace(/\n/g, "<br>");
  const isLiked = likedMessageIds.has(msg.id);
  const imgHTML = msg.image
    ? `<div class="message-media">
         <img src="${msg.image}" class="message-img" alt="穿搭照">
       </div>`
    : "";
  
  const replyCount = (msg.replies || []).length;

  const repliesHTML = (msg.replies || [])
    .map((rep) => {
      const repName = rep.nickname?.trim() || "訪客";
      const repContent = escapeHTML(rep.content).replace(/\n/g, "<br>");
      // ★ 回覆是否已按讚
      const isRepLiked = likedMessageIds.has(rep.id);
      // 確保舊資料有 likes 欄位
      const repLikes = rep.likes || 0;

      return `
        <li class="reply-item" data-reply-id="${rep.id}">
          <div class="reply-header">
            <span class="reply-nickname">${repName}</span>
            <div class="reply-meta">
              
              <button 
                type="button" 
                class="btn-reply-like ${isRepLiked ? "liked" : ""}"
                title="給個讚"
              >
                ${isRepLiked ? "❤️" : "♡"} <span class="reply-like-count">${repLikes}</span>
              </button>

              <span class="reply-time">${formatTime(rep.createdAt)}</span>
              
              <button
                type="button"
                class="btn-icon btn-reply-delete"
                aria-label="刪除回覆"
              >🗑️</button>
            </div>
          </div>
          <p class="reply-content">${repContent}</p>
        </li>
      `;
    })
    .join("");

  return `
    <li class="message-card" data-id="${msg.id}">
      <div class="message-header">
        <span class="message-nickname">${escapeHTML(nickname)}</span>
        <span class="message-time">${formatTime(msg.createdAt)}</span>
      </div>

      <p class="message-content">${contentHTML}</p>
      ${imgHTML}

      <div class="message-actions">
        <button
          type="button"
          class="btn-text btn-like ${isLiked ? "liked" : ""}"
        >
          ${isLiked ? "💖" : "🤍"}
          <span class="like-count">${msg.likes || 0}</span>
        </button>

        <button type="button" class="btn-text btn-reply-toggle">
          💬 回覆(${replyCount})
        </button>

        <button
          type="button"
          class="btn-icon btn-delete"
          aria-label="刪除留言"
        >🗑️</button>
      </div>

      <div class="reply-area hidden">
        <form class="reply-form">
          <input
            type="text"
            name="replyNickname"
            class="input-sm"
            placeholder="暱稱（可留空）"
          />
          
          <div class="input-wrapper">
            <textarea
              name="replyContent"
              rows="2"
              placeholder="寫下你的回覆..."
              maxlength="500"
              required
            ></textarea>
            <span class="char-count reply-char-count">0/500</span>
          </div>

          <button type="submit" class="btn small">送出回覆</button>
        </form>

        <ul class="reply-list">
          ${repliesHTML}
        </ul>
      </div>
    </li>
  `;
}

function renderMessages() {
  const list = document.getElementById("message-list");
  if (!list) return;

  if (messages.length === 0) {
    list.innerHTML = `
      <li class="message-empty">目前還沒有留言，快來當第一個分享穿搭的人吧！</li>
    `;
    return;
  }

  // 最新的在最上方
  const itemsHTML = [...messages]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(createMessageHTML)
    .join("");

  list.innerHTML = itemsHTML;
}

// 送出新留言（含圖片）
function handleNewMessageSubmit(event) {
  event.preventDefault();
  const nicknameInput = document.getElementById("nickname");
  const contentTextarea = document.getElementById("content");
  const fileInput = document.getElementById("msg-image");
  
  // 計數器歸零
  const charCount = document.getElementById("main-char-count");

  const nickname = nicknameInput.value.trim();
  const content = contentTextarea.value.trim();

  if (!content) return;

  const processMessage = (imgBase64) => {
    const newMessage = {
      id: Date.now().toString(),
      nickname,
      content,
      image: imgBase64 || null,
      createdAt: new Date().toISOString(),
      likes: 0,
      replies: [],
    };

    messages.push(newMessage);
    saveMessages();
    renderMessages();

    // 清空欄位
    contentTextarea.value = "";
    fileInput.value = "";
    if(charCount) charCount.textContent = "0/500"; // 重置計數器
  };

  if (fileInput.files && fileInput.files[0]) {
    const reader = new FileReader();
    reader.onload = function (e) {
      processMessage(e.target.result);
    };
    reader.readAsDataURL(fileInput.files[0]);
  } else {
    processMessage(null);
  }
}

function setupForm() {
  const form = document.getElementById("new-message-form");
  if (!form) return;
  form.addEventListener("submit", handleNewMessageSubmit);

  // ★ 主留言框：監聽輸入事件更新計數器
  const contentTextarea = document.getElementById("content");
  const charCount = document.getElementById("main-char-count");
  if (contentTextarea && charCount) {
    contentTextarea.addEventListener("input", () => {
      updateCharCount(contentTextarea, charCount);
    });
  }
}

function setupListEvents() {
  const list = document.getElementById("message-list");
  if (!list) return;

  // 使用事件委派監聽所有互動
  list.addEventListener("click", (event) => {
    const card = event.target.closest(".message-card");
    if (!card) return;
    const id = card.dataset.id;
    const msg = messages.find((m) => m.id === id);
    if (!msg) return;

    // 🗑 刪除整則留言
    if (event.target.closest(".btn-delete")) {
      if (confirm("確定要刪除這則留言嗎？")) {
        messages = messages.filter((m) => m.id !== id);
        likedMessageIds.delete(id);
        
        // 也要刪除這則留言底下所有回覆的按讚紀錄
        if(msg.replies) {
            msg.replies.forEach(r => likedMessageIds.delete(r.id));
        }

        saveMessages();
        saveLikes();
        renderMessages();
      }
      return;
    }

    // 🗑 刪除回覆
    if (event.target.closest(".btn-reply-delete")) {
      const replyItem = event.target.closest(".reply-item");
      if (!replyItem) return;
      const replyId = replyItem.dataset.replyId;
      if (!replyId) return;

      if (!confirm("確定要刪除這則回覆嗎？")) return;

      msg.replies = (msg.replies || []).filter((r) => r.id !== replyId);
      likedMessageIds.delete(replyId); // 刪除該回覆的按讚紀錄

      saveMessages();
      saveLikes();
      renderMessages();

      // 保持展開
      const updatedArea = document.querySelector(
        `.message-card[data-id="${id}"] .reply-area`
      );
      if (updatedArea) updatedArea.classList.remove("hidden");
      return;
    }

    // 💖 主留言愛心
    if (event.target.closest(".btn-like")) {
      if (likedMessageIds.has(id)) {
        msg.likes = Math.max((msg.likes || 0) - 1, 0);
        likedMessageIds.delete(id);
      } else {
        msg.likes = (msg.likes || 0) + 1;
        likedMessageIds.add(id);
      }
      saveMessages();
      saveLikes();
      renderMessages();
      return;
    }

    // ★ 回覆愛心
    const replyLikeBtn = event.target.closest(".btn-reply-like");
    if (replyLikeBtn) {
      const replyItem = replyLikeBtn.closest(".reply-item");
      if (!replyItem) return;
      const replyId = replyItem.dataset.replyId;
      
      const reply = msg.replies.find(r => r.id === replyId);
      if (!reply) return;

      // 初始化 likes 屬性 (舊資料可能沒有)
      if (typeof reply.likes !== 'number') reply.likes = 0;

      if (likedMessageIds.has(replyId)) {
        // 收回讚
        reply.likes = Math.max(reply.likes - 1, 0);
        likedMessageIds.delete(replyId);
      } else {
        // 按讚
        reply.likes += 1;
        likedMessageIds.add(replyId);
      }

      saveMessages();
      saveLikes();
      renderMessages();
      
      // 保持展開
      const updatedArea = document.querySelector(
        `.message-card[data-id="${id}"] .reply-area`
      );
      if (updatedArea) updatedArea.classList.remove("hidden");
      return;
    }

    // 展開 / 收合回覆區
    if (event.target.closest(".btn-reply-toggle")) {
      const replyArea = card.querySelector(".reply-area");
      if (replyArea) {
        replyArea.classList.toggle("hidden");
      }
      return;
    }
  });

  // ★ 監聽回覆輸入框的字數變化 (事件委派 input)
  list.addEventListener("input", (event) => {
    if (event.target.tagName === "TEXTAREA" && event.target.name === "replyContent") {
        const wrapper = event.target.closest(".input-wrapper");
        if (wrapper) {
            const countSpan = wrapper.querySelector(".reply-char-count");
            if (countSpan) {
                updateCharCount(event.target, countSpan);
            }
        }
    }
  });

  // 回覆 submit
  list.addEventListener("submit", (event) => {
    const form = event.target.closest(".reply-form");
    if (!form) return;
    event.preventDefault();

    const card = event.target.closest(".message-card");
    if (!card) return;
    const id = card.dataset.id;
    const msg = messages.find((m) => m.id === id);
    if (!msg) return;

    const nickname = form.replyNickname.value.trim();
    const contentInput = form.replyContent;
    const content = contentInput.value.trim();
    if (!content) return;

    const reply = {
      id: Date.now().toString(), // 使用 timestamp 當 id
      nickname,
      content,
      createdAt: new Date().toISOString(),
      likes: 0 // ★ 新增 likes 欄位
    };

    if (!msg.replies) msg.replies = [];
    msg.replies.push(reply);
    saveMessages();
    renderMessages();

    // 回覆送出後，保持回覆區展開
    const updatedArea = document.querySelector(
      `.message-card[data-id="${id}"] .reply-area`
    );
    if (updatedArea) {
      updatedArea.classList.remove("hidden");
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadMessages();
  loadLikes();
  setupForm();
  setupListEvents();
  renderMessages();
});
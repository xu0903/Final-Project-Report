// messageboard.js

const STORAGE_KEY = "fitmatch_messageboard";
const LIKE_STORAGE_KEY = "fitmatch_message_likes"; // 記錄已按讚的留言
let messages = [];
let likedMessageIds = new Set(); // 存放已按讚的留言 id

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

// 讀取已按愛心的留言 id
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

// 存回已按愛心的留言 id
function saveLikes() {
  localStorage.setItem(LIKE_STORAGE_KEY, JSON.stringify([...likedMessageIds]));
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

      return `
        <li class="reply-item" data-reply-id="${rep.id}">
          <div class="reply-header">
            <span class="reply-nickname">${repName}</span>
            <div class="reply-meta">
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
           <a>  </a> 回覆(${replyCount})
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
          <textarea
            name="replyContent"
            rows="2"
            placeholder="寫下你的回覆..."
            required
          ></textarea>
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

    // 清空欄位（暱稱可保留方便連續留言）
    contentTextarea.value = "";
    fileInput.value = "";
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
}

function setupListEvents() {
  const list = document.getElementById("message-list");
  if (!list) return;

  // 點擊事件：刪留言 + 刪回覆 + 愛心 + 展開回覆
  list.addEventListener("click", (event) => {
    const card = event.target.closest(".message-card");
    if (!card) return;
    const id = card.dataset.id;
    const msg = messages.find((m) => m.id === id);
    if (!msg) return;

    // 🗑 刪除整則留言
    if (event.target.closest(".btn-delete")) {
      const ok = confirm("確定要刪除這則留言嗎？");
      if (ok) {
        messages = messages.filter((m) => m.id !== id);
        likedMessageIds.delete(id);
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

      const ok = confirm("確定要刪除這則回覆嗎？");
      if (!ok) return;

      msg.replies = (msg.replies || []).filter((r) => r.id !== replyId);
      saveMessages();
      renderMessages();

      // 刪除後保持這則留言的回覆區展開
      const updatedArea = document.querySelector(
        `.message-card[data-id="${id}"] .reply-area`
      );
      if (updatedArea) {
        updatedArea.classList.remove("hidden");
      }
      return;
    }

    // 💖 愛心
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

    // 展開 / 收合回覆區
    if (event.target.closest(".btn-reply-toggle")) {
      const replyArea = card.querySelector(".reply-area");
      if (replyArea) {
        replyArea.classList.toggle("hidden");
      }
      return;
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
    const content = form.replyContent.value.trim();
    if (!content) return;

    const reply = {
      id: Date.now().toString(),
      nickname,
      content,
      createdAt: new Date().toISOString(),
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

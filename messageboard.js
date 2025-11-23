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
  const isLiked = likedMessageIds.has(msg.id); // 這則留言有沒有被這個使用者按過

  const repliesHTML = (msg.replies || [])
    .map((rep) => {
      const repName = rep.nickname?.trim() || "訪客";
      const repContent = escapeHTML(rep.content).replace(/\n/g, "<br>");
      return `
        <li class="reply-item">
          <div class="reply-header">
            <span class="reply-nickname">${repName}</span>
            <span class="reply-time">${formatTime(rep.createdAt)}</span>
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

      <div class="message-actions">
        <button
          type="button"
          class="btn-text btn-like ${isLiked ? "liked" : ""}"
        >
          ${isLiked ? "💖" : "🤍"}
          <span class="like-count">${msg.likes || 0}</span>
        </button>
        <button type="button" class="btn-text btn-reply-toggle">
          回覆
        </button>
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

function handleNewMessageSubmit(event) {
  event.preventDefault();
  const nicknameInput = document.getElementById("nickname");
  const contentTextarea = document.getElementById("content");

  const nickname = nicknameInput.value.trim();
  const content = contentTextarea.value.trim();

  if (!content) return;

  const newMessage = {
    id: Date.now().toString(),
    nickname,
    content,
    createdAt: new Date().toISOString(),
    likes: 0,
    replies: [],
  };

  messages.push(newMessage);
  saveMessages();
  renderMessages();

  // 清空表單
  contentTextarea.value = "";
  // nickname 保留，方便連續留言
}

function setupForm() {
  const form = document.getElementById("new-message-form");
  if (!form) return;
  form.addEventListener("submit", handleNewMessageSubmit);
}

function setupListEvents() {
  const list = document.getElementById("message-list");
  if (!list) return;

  // 事件委派：處理按讚 + 展開回覆 + 送出回覆
  list.addEventListener("click", (event) => {
    const card = event.target.closest(".message-card");
    if (!card) return;
    const id = card.dataset.id;
    const msg = messages.find((m) => m.id === id);
    if (!msg) return;

    // 愛心：再次點擊可以收回
    if (event.target.closest(".btn-like")) {
      if (likedMessageIds.has(id)) {
        // 已按過，變成收回愛心
        msg.likes = Math.max((msg.likes || 0) - 1, 0);
        likedMessageIds.delete(id);
      } else {
        // 第一次按，增加愛心
        msg.likes = (msg.likes || 0) + 1;
        likedMessageIds.add(id);
      }
      saveMessages();
      saveLikes();
      renderMessages();
      return;
    }

    // 展開/收合回覆區
    if (event.target.closest(".btn-reply-toggle")) {
      const replyArea = card.querySelector(".reply-area");
      if (replyArea) {
        replyArea.classList.toggle("hidden");
      }
      return;
    }
  });

  // 處理回覆的 submit
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

    // 回覆送出後，保持這張卡片的回覆區是展開的
    const updatedCard = document.querySelector(
      `.message-card[data-id="${id}"] .reply-area`
    );
    if (updatedCard) {
      updatedCard.classList.remove("hidden");
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

// messageboard.js 重點修改

// 1. 修改 HTML 生成，加入圖片與刪除按鈕
function createMessageHTML(msg) {
  // ... (前段變數處理) ...
  const isLiked = likedMessageIds.has(msg.id);

  // 處理圖片 HTML
  const imgHTML = msg.image 
    ? `<img src="${msg.image}" class="message-img" alt="穿搭照">` 
    : "";

  return `
    <li class="message-card" data-id="${msg.id}">
      <div class="message-header">
        <div>
          <span class="message-nickname">${escapeHTML(nickname)}</span>
          <span class="message-time">${formatTime(msg.createdAt)}</span>
        </div>
        <button type="button" class="btn-delete">刪除</button>
      </div>

      <p class="message-content">${contentHTML}</p>
      ${imgHTML} 

      <div class="message-actions">
         <button type="button" class="btn-text btn-like ${isLiked ? "liked" : ""}">
            ${isLiked ? "💖" : "🤍"} <span class="like-count">${msg.likes || 0}</span>
         </button>
         <button type="button" class="btn-text btn-reply-toggle">回覆</button>
      </div>
      
      <div class="reply-area hidden">...</div>
    </li>
  `;
}

// 2. 修改發送留言處理 (加入圖片讀取)
function handleNewMessageSubmit(event) {
  event.preventDefault();
  const nicknameInput = document.getElementById("nickname");
  const contentTextarea = document.getElementById("content");
  const fileInput = document.getElementById("msg-image"); // 抓圖片

  const nickname = nicknameInput.value.trim();
  const content = contentTextarea.value.trim();

  if (!content) return;

  const processMessage = (imgBase64) => {
    const newMessage = {
      id: Date.now().toString(),
      nickname,
      content,
      image: imgBase64 || null, // 存圖片 Base64
      createdAt: new Date().toISOString(),
      likes: 0,
      replies: [],
    };

    messages.push(newMessage);
    saveMessages();
    renderMessages();
    
    // 清空
    contentTextarea.value = "";
    fileInput.value = "";
  };

  // 檢查是否有圖
  if (fileInput.files && fileInput.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      processMessage(e.target.result); // 讀完圖後存檔
    };
    reader.readAsDataURL(fileInput.files[0]);
  } else {
    processMessage(null); // 沒圖直接存
  }
}

// 3. 事件監聽加入「刪除」功能
function setupListEvents() {
  const list = document.getElementById("message-list");
  if (!list) return;

  list.addEventListener("click", (event) => {
    const card = event.target.closest(".message-card");
    if (!card) return;
    const id = card.dataset.id;

    // --- 刪除功能 ---
    if (event.target.classList.contains("btn-delete")) {
      if (confirm("確定要刪除這則留言嗎？")) {
        messages = messages.filter(m => m.id !== id); // 過濾掉該 id
        saveMessages();
        renderMessages();
      }
      return;
    }

    // ... (原本的按讚與回覆邏輯保持不變) ...
  });
  
  // ... (原本的回覆 submit 邏輯保持不變) ...
}
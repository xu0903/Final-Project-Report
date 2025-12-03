document.addEventListener("DOMContentLoaded", () => {
  // 1. 從 LocalStorage 讀取「當前登入」的使用者資料
  const userJson = localStorage.getItem("fitmatch_user");
  
  // 取得頁面上的顯示元素
  const nickNameEl = document.getElementById("display-nickname");
  const accountEl = document.getElementById("display-account");
  const logoutBtn = document.getElementById("btn-logout");
  const loginLink = document.getElementById("link-login");

  if (userJson) {
    // --- 狀況 A：使用者已登入（有資料）---
    try {
      const user = JSON.parse(userJson);

      // 更新畫面文字
      if (nickNameEl) nickNameEl.textContent = user.nickname || "會員";
      if (accountEl) accountEl.textContent = user.account || ""; 

      // 顯示登出按鈕，隱藏登入連結
      if (logoutBtn) {
        logoutBtn.style.display = "inline-block";
        logoutBtn.textContent = "登出"; // 確保文字正確
      }
      if (loginLink) loginLink.style.display = "none";
    } catch (e) {
      console.error("會員資料解析失敗", e);
      // 若資料損毀，視為未登入
      localStorage.removeItem("fitmatch_user");
      window.location.reload();
    }

  } else {
    // --- 狀況 B：未登入（無資料）---
    if (nickNameEl) nickNameEl.textContent = "訪客";
    if (accountEl) accountEl.textContent = "請先登入或註冊";

    // 隱藏登出按鈕，顯示登入連結
    if (logoutBtn) logoutBtn.style.display = "none";
    if (loginLink) loginLink.style.display = "inline-block";
  }

  // 2. 實作登出功能
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      if (confirm("確定要登出嗎？")) {
        // ★ 重點：只移除「當前使用者 (fitmatch_user)」，保留「已儲存帳號 (fitmatch_saved_sessions)」
        // 這樣回到登入頁時，才能列出切換帳號的選單
        localStorage.removeItem("fitmatch_user");
        
        // 為了相容性，也移除舊的 session key (如果有用到的話)
        localStorage.removeItem("fitmatch_account");

        // 登出後跳轉回登入頁，方便使用者切換帳號
        window.location.href = "login.html";
      }
    });
  }
});
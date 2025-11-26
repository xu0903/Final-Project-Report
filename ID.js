document.addEventListener("DOMContentLoaded", () => {
  // 1. 從 LocalStorage 讀取使用者資料
  const userJson = localStorage.getItem("fitmatch_user");
  
  // 取得頁面上的顯示元素
  const nickNameEl = document.getElementById("display-nickname");
  const accountEl = document.getElementById("display-account");
  const logoutBtn = document.getElementById("btn-logout");
  const loginLink = document.getElementById("link-login");

  if (userJson) {
    // --- 狀況 A：使用者已登入（有資料）---
    const user = JSON.parse(userJson);

    // 更新畫面文字
    if (nickNameEl) nickNameEl.textContent = user.nickname;
    if (accountEl) accountEl.textContent = user.account; // 或者 user.account

    // 顯示登出按鈕，隱藏登入連結
    if (logoutBtn) logoutBtn.style.display = "inline-block";
    if (loginLink) loginLink.style.display = "none";

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
        // 清除使用者資料
        localStorage.removeItem("fitmatch_user");
        // 重新整理頁面以更新狀態
        window.location.reload();
      }
    });
  }
});
document.addEventListener("DOMContentLoaded", () => {
  let userJson = null; // 全域變數

  function updateUI(user) {
    console.log("Updating UI with user data:", user);
    console.log("user type:", typeof(user));
    const nickNameEl = document.getElementById("display-nickname");
    const accountEl = document.getElementById("display-account");
    const logoutBtn = document.getElementById("btn-logout");
    const loginLink = document.getElementById("link-login");
    console.log("NickName Element:", user.Username);
    console.log("Account Element:", user.Email); 

    if (user) {
      // 使用者已登入
      if (nickNameEl) nickNameEl.textContent = user.Username;
      if (accountEl) accountEl.textContent = user.Email;

      if (logoutBtn) logoutBtn.style.display = "inline-block";
      if (loginLink) loginLink.style.display = "none";
    } else {
      // 未登入
      if (nickNameEl) nickNameEl.textContent = "訪客";
      if (accountEl) accountEl.textContent = "尚無資料";

      if (logoutBtn) logoutBtn.style.display = "none";
      if (loginLink) loginLink.style.display = "inline-block";
    }
  }

  async function loadUserData() {
    try {
      const res = await fetch('/getUserData', {
        method: 'GET',
        credentials: 'include'
      });
      const data = await res.json();

      if (!data.loggedIn) {
        return null;
      }

      return data.user; // 已經是物件
    } catch (err) {
      console.error('取得使用者資料失敗', err);
      return null;
    }
  }

  (async () => {
    userJson = await loadUserData();

    console.log("Loaded user data:", userJson);
    updateUI(userJson);
  })();

  // 登出功能
  const logoutBtn = document.getElementById("btn-logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      if (confirm("確定要登出嗎？")) {
        // 呼叫後端登出 API 清除 cookie
        await fetch('/logout', { method: 'POST', credentials: 'include' });
        window.location.reload();
      }
    });
  }
});

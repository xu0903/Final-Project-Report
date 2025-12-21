function checkLoginStatus() {
  fetch('/getUserData', {
    method: 'GET',
    credentials: 'include'  // 傳送 Cookie
  })
    .then(async res => {
      if (res.status === 401) {
        // 捕獲 401 (未登入) 狀態，但不拋出錯誤，讓後續 .catch 執行導向
        //直接登出以清除無效的 Cookie
        console.log("未登入：JWT Cookie 無效或過期。");
        try { await fetch('/logout', { method: 'POST', credentials: 'include' }); } catch (e) { }
        return null; // 傳回 null 表示未登入
      }
      if (!res.ok) {
        console.error("伺服器錯誤:", res.status);
        return null; // 處理其他伺服器錯誤
      }
      return res.json();
    })
    .then(data => {
      // 只有在 data 存在 (成功登入) 時才執行
      if (!data) {
        return;
      }

      console.log("使用者已登入：", data);

      const usernameBox = document.getElementById("username");
      if (usernameBox) {
        // 應使用後端回傳的欄位名 (Username)
        usernameBox.textContent = data.user.Username;
      }

      // 將 API 取得的最新資料儲存到 LocalStorage 的 SAVED_SESSIONS_KEY 中
      const SAVED_SESSIONS_KEY = "fitmatch_saved_sessions";
      let sessions = [];
      try { sessions = JSON.parse(localStorage.getItem(SAVED_SESSIONS_KEY) || "[]"); } catch (e) { }

      const activeUser = {
        nickname: data.user.Username,
        account: data.user.Email,
        avatar: data.user.avatar,
        userId: data.user.UserID,
      };

      const idx = sessions.findIndex(s => s.account === data.user.Email);
      if (idx >= 0) {
        // 更新資料
        sessions[idx] = { ...sessions[idx], ...activeUser };
      } else {
        // 新增資料
        sessions.push(activeUser);
      }
      localStorage.setItem(SAVED_SESSIONS_KEY, JSON.stringify(sessions));

      // 其他登入後要做的事可以寫在這裡
    })
    .catch(err => {
      // 只有在連線層級發生錯誤 (例如伺服器無回應) 時，才會進入這裡
      console.error("連線錯誤，無法檢查登入狀態:", err);
    });
}

document.addEventListener("DOMContentLoaded", checkLoginStatus);
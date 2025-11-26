document.addEventListener("DOMContentLoaded", () => {
  const regBtn = document.getElementById("btn-register");
  const errorMsg = document.getElementById("error-msg");

  if (!regBtn) return; // 如果找不到按鈕就不執行

  regBtn.addEventListener("click", () => {
    // 1. 取得使用者輸入的值
    const nickname = document.getElementById("reg-nickname").value.trim();
    const account = document.getElementById("reg-account").value.trim();
    const password = document.getElementById("reg-password").value;
    const confirm = document.getElementById("reg-confirm").value;

    // 清除錯誤訊息
    errorMsg.textContent = "";

    // 2. 檢查使用者是否有輸入完整資料
    if (!nickname || !account || !password || !confirm) {
      errorMsg.textContent = "⚠️ 請填寫所有欄位！";
      return;
    }

    // 3. 確認兩次輸入的密碼要相同
    if (password !== confirm) {
      errorMsg.textContent = "⚠️ 兩次密碼輸入不一致，請重新確認。";
      return;
    }

    // 4. 建立使用者資料物件
    const userData = {
      nickname: nickname,
      account: account,
      password: password, // 注意：實際專案中密碼不建議明文存在 LocalStorage，這裡僅為練習用
      regDate: new Date().toLocaleDateString()
    };

    // 5. 將資料紀錄到 local storage
    // 我們使用 "fitmatch_user" 作為 key
    localStorage.setItem("fitmatch_user", JSON.stringify(userData));

    // 6. 註冊成功，跳轉至會員頁面
    alert(`註冊成功！歡迎加入 FitMatch，${nickname}！`);
    window.location.href = "ID.html";
  });
});
document.addEventListener("DOMContentLoaded", () => {
    // API 登入 (需確保此函式存在且可以設置 JWT Cookie)
    async function performApiLogin(email, password, isNewLogin) {
        try {
            const response = await fetch('/authenticate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email, password: password })
            });

            const data = await response.json();

            if (response.ok) {
                // 成功登入 (後端已設置 JWT Cookie)
                const userData = {
                    nickname: data.user.username,
                    account: data.user.email,
                    avatar: data.user.avatar,
                    userId: data.user.userId
                };

                return true;
            } else {
                // 登入失敗 (如果註冊成功，理論上不會失敗，但仍需處理)
                throw new Error(data.message || "登入驗證失敗");
            }

        } catch (err) {
            // 登入失敗不需要報警，讓註冊頁面繼續顯示錯誤訊息即可
            console.error("自動登入失敗:", err);
            throw new Error("自動登入失敗"); // 拋出錯誤，讓 addUser 停止跳轉
        }
    }

    // 確保您在其他地方定義了 performApiLogin 函式
    async function addUser(name, email, password) { // 註冊函式改為 async
        try {
            const res = await fetch('/user-register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });

            const data = await res.json();

            // 檢查註冊是否成功
            if (data.success) {
                msgBox.classList.add("success");
                msgBox.textContent = data.message || "註冊成功，正在為您登入...";

                // 步驟一：呼叫 API 登入
                // 注意: performApiLogin 必須被定義在整個 document.addEventListener 範圍內
                // 讓其設定 JWT Cookie
                await performApiLogin(email, password, true);

                // 步驟二：登入成功後跳轉
                setTimeout(() => {
                    window.location.href = "ID.html";
                }, 800);

            } else {
                msgBox.classList.remove("success");
                msgBox.classList.add("warning");
                msgBox.textContent = data.message;
            }
        } catch (err) {
            console.error(err);
            msgBox.classList.remove("success");
            msgBox.classList.add("warning");
            msgBox.textContent = "網路或伺服器錯誤，請稍後再試";
        }
    }

    const form = document.getElementById('register-form');

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        const nickname = document.getElementById("reg-nickname").value.trim();
        const email = document.getElementById("reg-email").value.trim();
        const password = document.getElementById("reg-password").value;
        const confirmPassword = document.getElementById("reg-confirmPassword").value;
        const msgBox = document.getElementById("msgBox"); // 顯示訊息的元素

        // 清除錯誤訊息
        msgBox.textContent = "";

        // 檢查使用者是否有輸入完整資料
        if (!nickname || !email || !password || !confirmPassword) {
            msgBox.classList.remove("success");
            msgBox.classList.add("warning");
            msgBox.textContent = "⚠️ 請填寫所有欄位！";
            return;
        }

        // 確認兩次輸入的密碼要相同
        if (password !== confirmPassword) {
            msgBox.classList.remove("success");
            msgBox.classList.add("warning");
            msgBox.textContent = "⚠️ 兩次密碼輸入不一致，請重新確認。";
            return;
        }

        addUser(nickname, email, password);
    });
});

//連接至login.html
document.querySelector('.btn-text').addEventListener('click', () => {
    window.location.href = 'login.html';
});
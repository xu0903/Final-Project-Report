function addUser(name, email, password) {

    fetch('/add-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
    })
        .then(res => res.json()) // 改成解析 JSON
        .then(data => {
            // data 會是 { success: true/false, message: "..." }
            if (data.success) {
                msgBox.classList.add("success");
                setTimeout(() => {
                    window.location.href = "ID.html";
                }, 800);
            } else {
                msgBox.classList.remove("success");
                msgBox.classList.add("warning");
            }
            msgBox.textContent = data.message;
        })
        .catch(err => {
            console.error(err);
            msgBox.classList.remove("success");
            msgBox.classList.add("warning");
            msgBox.textContent = "網路或伺服器錯誤，請稍後再試";
        });
}



document.addEventListener("DOMContentLoaded", () => {
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

        // 2. 檢查使用者是否有輸入完整資料
        if (!nickname || !email || !password || !confirmPassword) {
            msgBox.classList.remove("success");
            msgBox.classList.add("warning");
            msgBox.textContent = "⚠️ 請填寫所有欄位！";
            return;
        }

        // 3. 確認兩次輸入的密碼要相同
        if (password !== confirmPassword) {
            msgBox.classList.remove("success");
            msgBox.classList.add("warning");
            msgBox.textContent = "⚠️ 兩次密碼輸入不一致，請重新確認。";
            return;
        }

        addUser(nickname, email, password);
    });
});
// login.js  （<script type="module" src="login.js"></script>）

const USERS_KEY = "fitmatch_users";
const ACCOUNT_KEY = "fitmatch_account";
const REMEMBER_KEY = "fitmatch_remember";

// 讀取已註冊使用者
function loadUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    const users = raw ? JSON.parse(raw) : [];
    return Array.isArray(users) ? users : [];
  } catch (e) {
    console.error("載入使用者失敗", e);
    return [];
  }
}

// 存回使用者列表
function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// 確保 Demo 帳號存在
function seedDemoUser() {
  const users = loadUsers();
  const exists = users.some((u) => u.email === "demo@fitmatch.dev");
  if (!exists) {
    users.push({
      email: "demo@fitmatch.dev",
      password: "fitmatch",
      nickname: "Demo 用戶",
      createdAt: new Date().toISOString(),
    });
    saveUsers(users);
  }
}

// 顯示欄位錯誤訊息
function setFieldError(input, msg) {
  const name = input.id;
  const small = document.querySelector(`small.err[data-for="${name}"]`);
  if (small) small.textContent = msg || "";
  if (msg) {
    input.classList.add("invalid");
  } else {
    input.classList.remove("invalid");
  }
}

// 驗證 Email
function validateEmail(input) {
  if (!input.value.trim()) {
    setFieldError(input, "請輸入 Email");
    return false;
  }
  if (!input.checkValidity()) {
    setFieldError(input, "Email 格式看起來怪怪的");
    return false;
  }
  setFieldError(input, "");
  return true;
}

// 驗證密碼
function validatePassword(input) {
  const v = input.value;
  if (!v) {
    setFieldError(input, "請輸入密碼");
    return false;
  }
  if (v.length < 6) {
    setFieldError(input, "密碼至少 6 碼");
    return false;
  }
  setFieldError(input, "");
  return true;
}

// 主程式
document.addEventListener("DOMContentLoaded", () => {
  seedDemoUser();

  const form = document.getElementById("login-form");
  const emailInput = document.getElementById("email");
  const pwdInput = document.getElementById("password");
  const togglePassBtn = document.getElementById("toggle-pass");
  const rememberChk = document.getElementById("remember");
  const msgBox = document.getElementById("msg");
  const submitBtn = document.getElementById("submit");
  const forgotLink = document.getElementById("forgot");

  // 讀取「記住我」資料（只記 email）
  try {
    const raw = localStorage.getItem(REMEMBER_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data.email) {
        emailInput.value = data.email;
        rememberChk.checked = !!data.remember;
      }
    }
  } catch (e) {
    console.error("載入 remember 失敗", e);
  }

  // 即時驗證 & 控制按鈕 disabled
  function updateSubmitState() {
    const okEmail = validateEmail(emailInput);
    const okPwd = validatePassword(pwdInput);
    submitBtn.disabled = !(okEmail && okPwd);
  }

  emailInput.addEventListener("input", () => {
    validateEmail(emailInput);
    updateSubmitState();
  });

  pwdInput.addEventListener("input", () => {
    validatePassword(pwdInput);
    updateSubmitState();
  });

  // 顯示 / 隱藏 密碼
  togglePassBtn.addEventListener("click", () => {
    const isPwd = pwdInput.type === "password";
    pwdInput.type = isPwd ? "text" : "password";
    togglePassBtn.textContent = isPwd ? "隱藏" : "顯示";
  });

  // 忘記密碼（demo 用，沒有真的寄信）
  forgotLink.addEventListener("click", (e) => {
    e.preventDefault();
    msgBox.textContent =
      "Demo 版暫不提供重設密碼，請使用 demo 帳號或重新註冊新帳號。";
  });

  // 登入送出
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    msgBox.textContent = "";

    const okEmail = validateEmail(emailInput);
    const okPwd = validatePassword(pwdInput);
    if (!okEmail || !okPwd) return;

    const email = emailInput.value.trim();
    const password = pwdInput.value;

    const users = loadUsers();
    const user = users.find((u) => u.email === email);

    if (!user || user.password !== password) {
      msgBox.textContent = "帳號或密碼錯誤，請再試一次。";
      return;
    }

    // 記住我：記錄 email（不建議記密碼）
    if (rememberChk.checked) {
      localStorage.setItem(
        REMEMBER_KEY,
        JSON.stringify({ email, remember: true })
      );
    } else {
      localStorage.removeItem(REMEMBER_KEY);
    }

    // 給會員頁用的帳號資訊（對應 member.js 的 ACCOUNT_KEY）
    localStorage.setItem(
      ACCOUNT_KEY,
      JSON.stringify({ account: email, password })
    );

    msgBox.textContent = "登入成功，即將前往會員頁…";
    // 簡單導向到會員頁
    setTimeout(() => {
      window.location.href = "ID.html";
    }, 800);
  });

  // 初次進來時做一次檢查
  updateSubmitState();
});

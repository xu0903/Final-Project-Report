// login.js （<script type="module" src="login.js"></script>）

const USERS_KEY = "fitmatch_users";
const ACCOUNT_KEY = "fitmatch_account";
const REMEMBER_KEY = "fitmatch_remember";

// ===== 驗證碼設定區 =====
// 圖片檔名（假設放在 ./captcha/ 資料夾），code 就是四位檔名本身
const CAPTCHA_IMAGES = [
  { file: "0110.png", code: "0110" },
  { file: "0484.png", code: "0484" },
  { file: "0815.png", code: "0815" },
  { file: "0848.png", code: "0848" },
  { file: "1604.png", code: "1604" },
  { file: "1679.png", code: "1679" },
  { file: "1875.png", code: "1875" },
  { file: "2089.png", code: "2089" },
  { file: "2658.png", code: "2658" },
  { file: "3104.png", code: "3104" },
  { file: "3355.png", code: "3355" },
  { file: "4078.png", code: "4078" },
  { file: "4319.png", code: "4319" },
  { file: "4822.png", code: "4822" },
  { file: "4986.png", code: "4986" },
  { file: "5104.png", code: "5104" },
  { file: "5241.png", code: "5241" },
  { file: "5606.png", code: "5606" },
  { file: "5738.png", code: "5738" },
  { file: "6226.png", code: "6226" },
  { file: "6796.png", code: "6796" },
  { file: "7541.png", code: "7541" },
  { file: "7767.png", code: "7767" },
  { file: "8022.png", code: "8022" },
  { file: "8964.png", code: "8964" },
  { file: "9243.png", code: "9243" },
  { file: "9290.png", code: "9290" },
  { file: "9781.png", code: "9781" }
];


let currentCaptcha = null; // 目前使用中的驗證碼物件

// 隨機選一張驗證碼圖
function pickRandomCaptcha() {
  if (!CAPTCHA_IMAGES.length) return;
  const idx = Math.floor(Math.random() * CAPTCHA_IMAGES.length);
  currentCaptcha = CAPTCHA_IMAGES[idx];

  const img = document.getElementById("captcha-img");
  img.style.width = "100px";
  if (img && currentCaptcha) {
    // 如果你的圖片位置不是 /captcha/ 開頭，改這裡
    img.src = `CAPTCHA/${currentCaptcha.file}`;
  }

  // 清空輸入框與錯誤
  const input = document.getElementById("captcha");
  if (input) {
    input.value = "";
    setFieldError(input, "");
  }
}

// ===== 使用者帳號相關(localstorage版本) =====
// function loadUsers() {
//   try {
//     const raw = localStorage.getItem(USERS_KEY);
//     const users = raw ? JSON.parse(raw) : [];
//     return Array.isArray(users) ? users : [];
//   } catch (e) {
//     console.error("載入使用者失敗", e);
//     return [];
//   }
// }

// ===== 使用者帳號相關(MySQL版本) =====
async function loadUsers() {
  try {
    const response = await fetch('/get-all-UserData');
    const users = await response.json();

    console.log("Users from database:", users);
    return Array.isArray(users) ? users : [];
  } catch (err) {
    console.error("Error fetching users:", err);
    return [];
  }
}


function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Demo 帳號
// function seedDemoUser() {
//   const users = loadUsers();
//   const exists = users.some((u) => u.email === "demo@fitmatch.dev");
//   if (!exists) {
//     users.push({
//       email: "demo@fitmatch.dev",
//       password: "fitmatch",
//       nickname: "Demo 用戶",
//       createdAt: new Date().toISOString(),
//     });
//     saveUsers(users);
//   }
// }

// ===== 表單驗證共用函式 =====
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

// 驗證「驗證碼」輸入
function validateCaptcha(input) {
  const v = input.value.trim();
  if (!v) {
    setFieldError(input, "請輸入驗證碼");
    return false;
  }
  if (!currentCaptcha) {
    setFieldError(input, "驗證碼載入失敗，請按『換一張』重試");
    return false;
  }

  if (v.toLowerCase() !== currentCaptcha.code.toLowerCase()) {
    setFieldError(input, "驗證碼錯誤，請再試一次");
    return false;
  }

  setFieldError(input, "");
  return true;
}

// 使用者驗證函式（呼叫伺服器端 /authenticate API）
async function authenticateUser(email, password) {
  try {
    const res = await fetch('/authenticate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    return {
      success: data.message === "登入成功",
      user: data.user || null
    };

  } catch (err) {
    console.error("Authentication error:", err);
    return { success: false, user: null };
  }
}




// ===== Main =====
document.addEventListener("DOMContentLoaded", () => {
  //seedDemoUser();

  const form = document.getElementById("login-form");
  const emailInput = document.getElementById("email");
  const pwdInput = document.getElementById("password");
  const togglePassBtn = document.getElementById("toggle-pass");
  const rememberChk = document.getElementById("remember");
  const msgBox = document.getElementById("msg");
  const submitBtn = document.getElementById("submit");
  const forgotLink = document.getElementById("forgot");

  const captchaInput = document.getElementById("captcha");
  const refreshCaptchaBtn = document.getElementById("refresh-captcha");

  // 讀取「記住我」資料
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

  // 控制登入按鈕是否可按
  function updateSubmitState() {
    const okEmail = validateEmail(emailInput); // Email 還是可以即時檢查格式
    // 密碼跟驗證碼只檢查「是否有填寫」，不檢查內容正確性
    const hasPwd = pwdInput.value.length >= 6;
    const hasCaptcha = captchaInput.value.trim().length > 0;

    submitBtn.disabled = !(okEmail && hasPwd && hasCaptcha);
  }


  emailInput.addEventListener("input", () => {
    validateEmail(emailInput);
    updateSubmitState();
  });

  pwdInput.addEventListener("input", () => {
    validatePassword(pwdInput);
    updateSubmitState();
  });

  if (captchaInput) {
    captchaInput.addEventListener("input", () => {
      // 這裡只檢查是否有值，不檢查正不正確，以免還沒打完就報錯
      setFieldError(captchaInput, "");
      updateSubmitState(); // 仍然更新按鈕狀態
    });
  }


  // 顯示 / 隱藏 密碼
  togglePassBtn.addEventListener("click", () => {
    const isPwd = pwdInput.type === "password";
    pwdInput.type = isPwd ? "text" : "password";
    togglePassBtn.textContent = isPwd ? "隱藏" : "顯示";
  });

  // 換一張驗證碼
  if (refreshCaptchaBtn) {
    refreshCaptchaBtn.addEventListener("click", () => {
      pickRandomCaptcha();
      // 換圖後順便鎖一下按鈕，等使用者再輸入
      submitBtn.disabled = true;
    });
  }

  // 忘記密碼（Demo）
  forgotLink.addEventListener("click", (e) => {
    e.preventDefault();
    msgBox.textContent =
      "Demo 版暫不提供重設密碼，請使用 demo 帳號或重新註冊新帳號。";
  });

  // 登入送出
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msgBox.textContent = "";
    msgBox.className = ""; // ★ 新增：先把 msgBox 的 class 清空

    const okEmail = validateEmail(emailInput);
    const okPwd = validatePassword(pwdInput);
    const okCaptcha = validateCaptcha(captchaInput); // 還是用你原本的驗證函式

    // === 驗證碼錯誤：增加醒目的提醒 ===
    if (!okCaptcha) {
      // 小字錯誤已經在 validateCaptcha 裡 setFieldError 過了
      msgBox.textContent = "驗證碼錯誤，已為您更換一張，請重新輸入新的驗證碼。";
      msgBox.classList.add("warning"); // ★ 新增：讓 #msg 變紅色（CSS 自己定義）

      alert("驗證碼錯誤，請重新輸入！"); // ★ 新增：彈窗提醒（不想要可以刪掉這行）

      captchaInput.value = "";   // ★ 新增：清空使用者剛打錯的內容
      pickRandomCaptcha();       // ★ 新增：換一張新的圖
      submitBtn.disabled = true; // ★ 新增：重新 disable 登入按鈕
      captchaInput.focus();      // ★ 新增：把游標移回驗證碼欄位
      return;                    // 中斷登入流程
    }

    // 其他欄位沒過也不要登入（這裡已經確定驗證碼是對的了）
    if (!okEmail || !okPwd) {
      pickRandomCaptcha();       // 你原本就有的行為：登入沒成功也換一次圖
      submitBtn.disabled = true;
      return;
    }

    const email = emailInput.value.trim();
    const password = pwdInput.value;

    // 呼叫伺服器端驗證使用者
    const authResult = await authenticateUser(email, password);
    if (!authResult.success || !authResult.user) {
      msgBox.textContent = authResult.message;
      msgBox.classList.add("warning"); // ★ 新增：錯誤也讓訊息變紅
      pickRandomCaptcha();
      submitBtn.disabled = true;
      return;
    }
    else {
      // 登入成功
      console.log("User authenticated:", authResult.user);
    }

    // 記住我：記錄 email
    if (rememberChk.checked) {
      localStorage.setItem(
        REMEMBER_KEY,
        JSON.stringify({ email, remember: true })
      );
    } else {
      localStorage.removeItem(REMEMBER_KEY);
    }

    // 給會員頁用的帳號資訊
    localStorage.setItem(
      ACCOUNT_KEY,
      JSON.stringify({ account: email, password })
    );

    msgBox.textContent = "登入成功，即將前往會員頁…";
    msgBox.classList.remove("warning");
    msgBox.classList.add("success"); // ★ 新增：成功改成綠色訊息（CSS 自己定義）

    setTimeout(() => {
      window.location.href = "ID.html";
    }, 800);
  });

  // 初始：先載入一張驗證碼 & 更新按鈕狀態
  pickRandomCaptcha();
  submitBtn.disabled = true;
});

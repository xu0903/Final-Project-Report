function checkLoginStatus() {
  fetch('/getUserData', {
    method: 'GET',
    credentials: 'include'  // cookie
  })
  .then(res => {
    if (!res.ok) {
      // 後端回 401 = 未登入
      throw new Error("not logged in");
    }
    return res.json();
  })
  .then(data => {
    console.log("使用者已登入：", data);

    const usernameBox = document.getElementById("username");
    if (usernameBox) {
      usernameBox.textContent = data.user.username;
    }

    // 其他登入後要做的事可以寫在這裡
  })
  .catch(err => {
    console.log("未登入");
  });
}


document.addEventListener("DOMContentLoaded", checkLoginStatus);


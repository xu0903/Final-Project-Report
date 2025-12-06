const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const jwt = require('jsonwebtoken');// 引入 jsonwebtoken 套件以處理 JWT
const app = express();
const port = 3000;


// 解析 JSON
app.use(express.json());

// 解析 Cookie
const cookieParser = require('cookie-parser');
app.use(cookieParser());

// 解析 URL-encoded
app.use(express.urlencoded({ extended: true }));

// 提供靜態檔案 (HTML + 前端 JS)
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

const bcrypt = require('bcrypt');// 引入 bcrypt 套件以進行密碼雜湊

// 載入環境變數
require('dotenv').config({ path: path.join(__dirname, '../mine.env') });// 連線 MySQL
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,//root
  password: process.env.DB_PASSWORD,//你的密碼
  database: process.env.DB_NAME//new_schema
});

// 連線測試
connection.connect(err => {
  if (err) {
    console.error('連線 MySQL 失敗:', err);
    return;
  }
  console.log('MySQL 連線成功！');
});

// 取得使用者帳號資料從 DataBase 的 users Table
app.get('/get-all-UserData', (req, res) => {
  connection.query('SELECT * FROM users', (err, results) => {
    if (err) {
      res.send('資料庫查詢錯誤');
      return;
    }

    // 將查到的資料以 JSON 格式回傳
    res.json(results);
  });
});


// 使用者登入身分驗證
app.post('/authenticate', async (req, res) => {
  const { email, password } = req.body;

  // 修改: 在查詢時一併取得 AvatarBase64 並別名為 avatar
  connection.query(
    'SELECT UserID, Username, Email, PasswordHash, AvatarBase64 AS avatar FROM users WHERE Email = ?', // <-- 確保取得 AvatarBase64
    [email],
    async (err, results) => {
      if (err || results.length === 0) {
        return res.status(400).json({ message: '帳號不存在' });
      }

      const user = results[0];

      const match = await bcrypt.compare(password, user.PasswordHash);
      if (!match) {
        return res.status(401).json({ message: '密碼錯誤' });
      }

      // 產生 JWT Token
      const token = jwt.sign(
        { userId: user.UserID, username: user.Username },
        process.env.JWT_SECRET || "mySecretKey",
        { expiresIn: "7d" }
      );

      // 把 token 放進 Cookie（HttpOnly 前端 JavaScript 無法讀）
      res.cookie("token", token, {
        httpOnly: true,
        secure: false, // 如果上傳到 HTTPS 改 true
        sameSite: "lax"
      });

      return res.json({
        message: "登入成功",
        user: {
          userId: user.UserID,
          username: user.Username,
          email: user.Email,
          avatar: user.avatar // <-- 傳回 avatar 資料
        }
      });
    }
  );
});

// 中介軟體：驗證 JWT Token
function authMiddleware(req, res, next) {
  const token = req.cookies.token; // 從 cookie 取 token

  if (!token) {
    return res.status(401).json({ message: "未登入" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "mySecretKey");
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "登入過期或無效" });
  }
}

// 5. 保持登入狀態，取得使用者資料
// 取得使用者完整資料
// 保持登入狀態，取得使用者資料
// 取得使用者完整資料
app.get('/getUserData', authMiddleware, (req, res) => {
  const userId = req.user.userId;

  // 從資料庫拿完整 user 資料
  // 💡 關鍵修改：新增 AvatarBase64 欄位並使用 AS avatar 別名
  const query = `
    SELECT 
      UserID, Username, Email, Height, Weight, BMI, CreatedAt, 
      AvatarBase64 AS avatar
    FROM users 
    WHERE UserID = ?
  `;
  connection.query(
    query,
    [userId],
    (err, results) => {
      if (err) {
        console.error('資料庫查詢失敗:', err);
        return res.status(500).json({ message: '資料庫查詢失敗' });
      }
      if (results.length === 0) return res.status(404).json({ message: '使用者不存在' });

      res.json({
        loggedIn: true,
        user: results[0] // results[0] 現在包含 avatar 欄位
      });
    }
  );
});

// 更新使用者資料
app.post('/update-user', authMiddleware, (req, res) => {
  const userId = req.user.userId;
  const updates = req.body;

  let updateFields = [];
  let updateValues = [];

  // 定義前端鍵名與資料庫欄位名的映射
  const fieldMap = {
    nickname: 'Username',
    avatar: 'AvatarBase64', // <-- 核心：將前端 avatar 映射到 DB 欄位
  };

  // ... (動態構建 SQL 的邏輯保持不變)
  for (const key in updates) {
    if (fieldMap[key] && updates[key] !== undefined) {
      updateFields.push(`${fieldMap[key]} = ?`);
      // 將 Base64 字串或 null (移除頭像時傳入 "") 加入參數
      updateValues.push(updates[key] === "" ? null : updates[key]);
    }
  }

  if (updateFields.length === 0) {
    return res.json({ success: true, message: '沒有需要更新的欄位' });
  }

  const query = `
        UPDATE users 
        SET ${updateFields.join(', ')} 
        WHERE UserID = ?
    `;

  updateValues.push(userId);

  connection.query(query, updateValues, (err, results) => {
    if (err) {
      console.error('更新使用者資料失敗:', err);
      // 由於 Base64 很大，確認是否有 'Payload Too Large' 或其他資料庫限制錯誤
      return res.status(500).json({ success: false, message: '更新使用者資料失敗' });
    }

    res.json({ success: true, message: '使用者資料更新成功' });
  });
});


// 使用者登出
app.post('/logout', (req, res) => {
  res.clearCookie("token");
  res.json({ message: "已登出" });
});

//取得user-favorites
// 需要 authMiddleware 取得登入使用者資訊
app.get('/get-user-favorites', authMiddleware, (req, res) => {
  const userId = req.user.userId;

  const query = `
    SELECT o.OutfitID, o.Title, o.Description, o.ImageURL,
           o.StyleKey, o.StyleLabel,
           o.ColorKey, o.ColorLabel,
           uf.FavoritedAt
    FROM user_favorites uf
    JOIN outfits o ON uf.OutfitID = o.OutfitID
    WHERE uf.UserID = ?
    ORDER BY uf.FavoritedAt DESC
  `;

  connection.query(query, [userId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: '無法取得收藏資料' });
    }

    res.json({ success: true, favorites: results });
  });
});

// 儲存favorite
app.post('/save-favorite', authMiddleware, (req, res) => {
  const userId = req.user.userId; // authMiddleware 應該會把 userId 放在 req.user
  const { outfitID } = req.body;
  console.log("req.user =", req.user);
  console.log("outfitID =", outfitID);


  if (!outfitID) return res.status(400).json({ success: false, message: '缺少 outfitID' });
  if (!userId) return res.status(401).json({ success: false, message: '未登入' });
  const query = `
    INSERT INTO user_favorites (UserID, OutfitID) 
    VALUES (?, ?) 
    ON DUPLICATE KEY UPDATE FavoritedAt = CURRENT_TIMESTAMP
  `;

  connection.query(query, [userId, outfitID], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: '儲存收藏失敗' });
    }
    res.json({ success: true, message: '已加入收藏' });
  });
});

// 刪除favorite
app.post('/delete-favorite', authMiddleware, (req, res) => {
  const userId = req.user.userId;
  const { outfitID } = req.body;

  if (!outfitID) return res.status(400).json({ success: false, message: '缺少 outfitID' });
  if (!userId) return res.status(401).json({ success: false, message: '未登入' });


  const query = 'DELETE FROM user_favorites WHERE UserID = ? AND OutfitID = ?';

  connection.query(query, [userId, outfitID], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: '刪除收藏失敗' });
    }
    res.json({ success: true, message: '已刪除收藏' });
  });
});

// 檢查是否已收藏該 outfit
app.get('/check-favorite', authMiddleware, (req, res) => {
  const userId = req.user.userId;
  const outfitID = req.query.outfitID;
  if (!outfitID) return res.status(400).json({ success: false, message: '缺少 outfitID' });
  if (!userId) return res.status(401).json({ success: false, message: '未登入' });
  const query = 'SELECT * FROM user_favorites WHERE UserID = ? AND OutfitID = ?';

  connection.query(query, [userId, outfitID], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: '查詢收藏狀態失敗' });
    }

    res.json({ success: true, isFavorite: results.length > 0 });
  });
});

// 新增使用者帳號資料至 DataBase 的 users Table
app.post('/user-register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = 'INSERT INTO users (Username, PasswordHash, Email) VALUES (?, ?, ?)';
    connection.query(query, [name, hashedPassword, email], (err, results) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ message: '該 Email 已被註冊過' });
        }
        console.log(err);
        return res.status(500).json({ success: false, message: '新增使用者失敗' });
      }

      // 回傳新產生的 userID
      const newUser = {
        userID: results.insertId,
        username: name,
        email: email,
      };

      res.json({
        success: true,
        message: '註冊成功，即將前往會員頁…',
        user: newUser
      });
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '伺服器錯誤' });
  }
});


//從mySQL取得tags資料
app.get('/get-all-tags', (req, res) => {
  connection.query('SELECT * FROM tags', (err, results) => {
    if (err) {
      res.send('資料庫查詢錯誤');
      return;
    }

    // 將查到的資料以 JSON 格式回傳
    res.json(results);
  });
});

//儲存產生的outfit資料到mySQL的outfits table
app.post('/save-outfit', (req, res) => {
  const { styleKey, styleLabel, colorKey, colorLabel, title, description, imageURL } = req.body;

  const query = `
    INSERT INTO outfits 
      (StyleKey, StyleLabel, ColorKey, ColorLabel, Title, Description, ImageURL) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  connection.query(
    query,
    [styleKey, styleLabel, colorKey, colorLabel, title, description || null, imageURL || null],
    (err, results) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: '儲存 outfit 失敗' });
      }
      res.json({ success: true, message: '儲存 outfit 成功', outfitID: results.insertId });
    }
  );
});

//取得特定 ID 的outfit table的資料
app.get('/get-outfit/:id', (req, res) => {
  const outfitID = req.params.id;
  const query = 'SELECT * FROM outfits WHERE OutfitID = ?';

  connection.query(query, [outfitID], (err, results) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ success: false, message: '查詢 outfit 失敗' });
    }

    res.json({ success: true, outfit: results[0] });
  });
});

/* --------------------------------------------
   新增歷史紀錄
--------------------------------------------- */
// 新增歷史紀錄
app.post('/add-history', authMiddleware, (req, res) => {
  const userID = req.user.userId; // 從 JWT 取得使用者 ID
  const { outfitID } = req.body;

  console.log("req.user =", req.user);
  console.log("History => userID =", userID);
  console.log("History => outfitID =", outfitID);

  if (!userID) {
    return res.status(401).json({ success: false, message: '未登入' });
  }
  if (!outfitID) {
    return res.status(400).json({ success: false, message: '缺少 outfitID' });
  }

  const query = `
    INSERT INTO outfitHistory (UserID, OutfitID)
    VALUES (?, ?)
  `;

  connection.query(query, [userID, outfitID], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: '伺服器錯誤' });
    }

    res.json({
      success: true,
      message: '已新增歷史紀錄',
      historyID: results.insertId
    });
  });
});



/* --------------------------------------------
   取得使用者歷史紀錄
--------------------------------------------- */
// 取得使用者歷史紀錄
app.get('/get-history', authMiddleware, (req, res) => {
  const userID = req.user.userId; // 從 JWT 取得使用者 ID

  if (!userID) {
    return res.status(401).json({ success: false, message: '未登入' });
  }

  const query = `
    SELECT h.HistoryID, h.OutfitID, h.CreatedAt, 
           o.Title, o.ColorKey, o.StyleKey
    FROM outfitHistory h
    JOIN outfits o ON h.OutfitID = o.OutfitID
    WHERE h.UserID = ?
    ORDER BY h.CreatedAt DESC
  `;

  connection.query(query, [userID], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: '伺服器錯誤' });
    }

    res.json({ success: true, history: results });
  });
});





// 啟動伺服器
app.listen(port, () => {
  console.log(`伺服器已啟動:http://localhost:${port}`);
});
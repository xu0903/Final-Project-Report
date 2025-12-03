const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const cors = require('cors'); // ★ 請確保有執行 npm install cors
require('dotenv').config({ path: path.join(__dirname, '../mine.env') });

const app = express();
const port = 3000;

// 1. CORS 設定 (允許前端跨網域傳送 Cookie)
app.use(cors({
  origin: 'http://127.0.0.1:5500', // ★ 請確認這是你前端 Live Server 的網址
  credentials: true // 允許攜帶 Cookie
}));

// 2. 解析器設定
// 增加 limit 限制，避免上傳 Base64 圖片時出現 PayloadTooLargeError
app.use(express.json({ limit: '10mb' })); 
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// 提供靜態檔案
app.use(express.static(path.join(__dirname, 'public')));

// 連線 MySQL
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

connection.connect(err => {
  if (err) {
    console.error('連線 MySQL 失敗:', err);
    return;
  }
  console.log('MySQL 連線成功！');
});

// ================= API 路由區域 =================

// 首頁
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// 取得所有使用者 (測試用)
app.get('/get-all-UserData', (req, res) => {
  connection.query('SELECT * FROM users', (err, results) => {
    if (err) {
      res.send('資料庫查詢錯誤');
      return;
    }
    res.json(results);
  });
});

// ★ 登入驗證 (含 Avatar 回傳)
app.post('/authenticate', async (req, res) => {
  const { email, password } = req.body;

  connection.query(
    'SELECT * FROM users WHERE Email = ?',
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

      // 產生 Token
      const token = jwt.sign(
        { userId: user.UserID, username: user.Username },
        process.env.JWT_SECRET || "mySecretKey",
        { expiresIn: "7d" }
      );

      res.cookie("token", token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax"
      });

      return res.json({
        message: "登入成功",
        user: {
          userId: user.UserID,
          username: user.Username,
          email: user.Email,
          avatar: user.Avatar // ★ 回傳頭像給前端
        }
      });
    }
  );
});

// 登出
app.post('/logout', (req, res) => {
  res.clearCookie("token");
  res.json({ message: "已登出" });
});

// ★ 註冊帳號
app.post('/add-user', async (req, res) => {
  const { name, email, password } = req.body;
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
    res.json({ success: true, message: '註冊成功' });
  });
});

// ★ 更新使用者資料 (暱稱 / 頭像)
app.post('/update-user', (req, res) => {
  const { email, nickname, avatar } = req.body;

  if (!email) return res.status(400).json({ success: false, message: '缺少 Email 識別' });

  let query = 'UPDATE users SET ';
  let params = [];

  if (nickname) {
    query += 'Username = ? ';
    params.push(nickname);
  }

  // avatar 允許空字串 (代表刪除頭像)
  if (avatar !== undefined) {
    if (params.length > 0) query += ', ';
    query += 'Avatar = ? ';
    params.push(avatar);
  }

  query += 'WHERE Email = ?';
  params.push(email);

  if (params.length === 1) {
    return res.json({ success: true, message: '沒有資料需要更新' });
  }

  connection.query(query, params, (err, results) => {
    if (err) {
      console.error('更新使用者失敗:', err);
      return res.status(500).json({ success: false, message: '資料庫錯誤' });
    }
    res.json({ success: true, message: '更新成功' });
  });
});

// 中介軟體：驗證 Token
function authMiddleware(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: "未登入" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "mySecretKey");
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "登入過期或無效" });
  }
}

// 取得使用者詳細資料 (需登入)
app.get('/getUserData', authMiddleware, (req, res) => {
  const userId = req.user.userId;
  connection.query(
    'SELECT UserID, Username, Email, Avatar, Height, Weight, BMI, CreatedAt FROM users WHERE UserID = ?',
    [userId],
    (err, results) => {
      if (err) return res.status(500).json({ message: '資料庫查詢失敗' });
      if (results.length === 0) return res.status(404).json({ message: '使用者不存在' });
      res.json({ loggedIn: true, user: results[0] });
    }
  );
});

// 取得收藏
app.get('/get-user-favorites', authMiddleware, (req, res) => {
  const userId = req.user.userId;
  const query = `
    SELECT o.OutfitID, o.Title, o.Description, o.ImageURL,
           o.GenderKey, o.GenderLabel, o.StyleKey, o.StyleLabel, o.ColorKey, o.ColorLabel,
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

// 加入收藏
app.post('/save-favorite', authMiddleware, (req, res) => {
  const userId = req.user.userId;
  const { outfitID } = req.body;
  
  if (!outfitID) return res.status(400).json({ success: false, message: '缺少 outfitID' });
  
  const query = `
    INSERT INTO user_favorites (UserID, OutfitID) 
    VALUES (?, ?) 
    ON DUPLICATE KEY UPDATE FavoritedAt = CURRENT_TIMESTAMP
  `;
  connection.query(query, [userId, outfitID], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: '儲存收藏失敗' });
    res.json({ success: true, message: '已加入收藏' });
  });
});

// 刪除收藏
app.post('/delete-favorite', authMiddleware, (req, res) => {
  const userId = req.user.userId;
  const { outfitID } = req.body;
  
  if (!outfitID) return res.status(400).json({ success: false, message: '缺少 outfitID' });

  const query = 'DELETE FROM user_favorites WHERE UserID = ? AND OutfitID = ?';
  connection.query(query, [userId, outfitID], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: '刪除收藏失敗' });
    res.json({ success: true, message: '已刪除收藏' });
  });
});

// 檢查收藏狀態
app.get('/check-favorite', authMiddleware, (req, res) => {
  const userId = req.user.userId;
  const outfitID = req.query.outfitID;
  
  if (!outfitID) return res.status(400).json({ success: false, message: '缺少 outfitID' });

  const query = 'SELECT * FROM user_favorites WHERE UserID = ? AND OutfitID = ?';
  connection.query(query, [userId, outfitID], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: '查詢失敗' });
    res.json({ success: true, isFavorite: results.length > 0 });
  });
});

// 取得 Tags
app.get('/get-all-tags', (req, res) => {
  connection.query('SELECT * FROM tags', (err, results) => {
    if (err) {
      res.send('資料庫查詢錯誤');
      return;
    }
    res.json(results);
  });
});

// 儲存 Outfit
app.post('/save-outfit', (req, res) => {
  const { genderKey, genderLabel, styleKey, styleLabel, colorKey, colorLabel, title, description, imageURL } = req.body;
  const query = `
    INSERT INTO outfits 
      (GenderKey, GenderLabel, StyleKey, StyleLabel, ColorKey, ColorLabel, Title, Description, ImageURL) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  connection.query(query, [genderKey, genderLabel, styleKey, styleLabel, colorKey, colorLabel, title, description, imageURL], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: '儲存 outfit 失敗' });
    res.json({ success: true, message: '儲存 outfit 成功', outfitID: results.insertId });
  });
});

// 啟動伺服器
app.listen(port, () => {
  console.log(`伺服器已啟動: http://localhost:${port}`);
});
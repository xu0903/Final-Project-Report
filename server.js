const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const jwt = require('jsonwebtoken');// 引入 jsonwebtoken 套件以處理 JWT
const multer = require('multer'); // 引入 multer 處理檔案上傳
const fs = require('fs'); // 引入 fs 處理檔案系統操作
const app = express();
const port = 3000;


// 解析 JSON
app.use(express.json());

// 解析 Cookie
const cookieParser = require('cookie-parser');
app.use(cookieParser());

// 解析 URL-encoded
app.use(express.urlencoded({ extended: true }));

// Multer 設定
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads"); // 存放資料夾位置
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});
const upload = multer({ storage });

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
  // 新增 AvatarBase64 欄位並使用 AS avatar 別名
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

//查詢收藏數量
app.get("/api/users/:id/favorite-count", (req, res) => {
  const UserID = parseInt(req.params.id, 10);
  console.log(typeof(UserID));

  const sql = "SELECT COUNT(*) AS favoriteCount FROM user_favorites WHERE UserID = ?";
  connection.query(sql, [UserID], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json({ UserID, favoriteCount: results[0].favoriteCount });
  });
});

//取得user-favorites
// 需要 authMiddleware 取得登入使用者資訊
app.get('/get-user-favorites', authMiddleware, (req, res) => {
  const userId = req.user.userId;

  const query = `
    SELECT o.OutfitID, o.Title, o.Description, o.ImageHat,o.ImageTop,o.ImageBottom,
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
  const { styleKey, styleLabel, colorKey, colorLabel, title, description, ImageHat, ImageTop, ImageBottom } = req.body;

  const query = `
    INSERT INTO outfits 
      (StyleKey, StyleLabel, ColorKey, ColorLabel, Title, Description, ImageHat, ImageTop, ImageBottom) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  connection.query(
    query,
    [styleKey, styleLabel, colorKey, colorLabel, title, description || null, ImageHat || null, ImageTop || null, ImageBottom || null],
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


// ------------------------
// 留言板 API
// ------------------------

// 取得所有貼文與回覆
app.get("/api/messages", (req, res) => {
  const postsQuery = `
    SELECT p.PostID, p.UserID, u.Username AS Nickname, u.AvatarBase64 AS Avatar, p.Content, p.ImageURL, p.CreatedAt,
           IFNULL(l.like_count,0) AS Likes
    FROM posts p
    JOIN users u ON p.UserID=u.UserID
    LEFT JOIN (SELECT PostID, COUNT(*) AS like_count FROM posts_likes GROUP BY PostID) l ON p.PostID=l.PostID
    ORDER BY p.CreatedAt DESC
  `;
  connection.query(postsQuery, (err, posts) => {
    if (err) return res.status(500).json({ error: err.message });
    const commentsQuery = `
      SELECT c.CommentID, c.PostID, c.UserID, u.Username AS Nickname, u.AvatarBase64 AS Avatar, c.Content, c.CreatedAt,
             IFNULL(l.like_count,0) AS Likes
      FROM comments c
      JOIN users u ON c.UserID=u.UserID
      LEFT JOIN (SELECT CommentID, COUNT(*) AS like_count FROM comments_likes GROUP BY CommentID) l ON c.CommentID=l.CommentID
      ORDER BY c.CreatedAt ASC
    `;
    
    connection.query(commentsQuery, (err, comments) => {
      if (err) return res.status(500).json({ error: err.message });
      const messages = posts.map(p => ({
        id: p.PostID.toString(),
        nickname: p.Nickname,
        userAvatar: p.Avatar,
        content: p.Content,
        image: p.ImageURL,
        createdAt: p.CreatedAt,
        likes: p.Likes,
        userId: p.UserID,
        comments: comments.filter(c => c.PostID === p.PostID).map(c => ({
          id: c.CommentID.toString(),
          nickname: c.Nickname,
          userAvatar: c.Avatar,
          content: c.Content,
          createdAt: c.CreatedAt,
          likes: c.Likes,
          userId: c.UserID
        }))
      }));
      res.json(messages);
    });
  });
});

// 新增貼文
app.post("/api/messages", authMiddleware, upload.single("image"), (req, res) => {
  const { content } = req.body;
  const userId = req.user.userId;
  if (!content) return res.status(400).json({ error: "Missing content" });

  let imageUrl = null;
  if (req.file) imageUrl = `uploads/${req.file.filename}`;

  connection.query(
    "INSERT INTO posts (UserID, Content, ImageURL) VALUES (?,?,?)",
    [userId, content, imageUrl],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      const postId = result.insertId;
      connection.query(
        "SELECT p.PostID, u.Username AS Nickname, u.AvatarBase64 AS Avatar, p.Content, p.ImageURL, p.CreatedAt FROM posts p JOIN users u ON p.UserID=u.UserID WHERE p.PostID=?",
        [postId],
        (err, rows) => {
          if (err) return res.status(500).json({ error: err.message });
          const post = rows[0];
          res.json({
            id: post.PostID.toString(),
            nickname: post.Nickname,
            userAvatar: post.Avatar,
            content: post.Content,
            image: post.ImageURL,
            createdAt: post.CreatedAt,
            likes: 0,
            comments: [],
            userId
          });
        }
      );
    }
  );
});


// 刪除貼文，連同uploads圖片一起刪除
app.delete("/api/messages/:id", authMiddleware, (req, res) => {
  const postId = req.params.id;
  // 先取得該貼文資料，找到圖片路徑
  connection.query("SELECT ImageURL FROM posts WHERE PostID=?", [postId], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.length === 0) return res.status(404).json({ error: "貼文不存在" });

    const imagePath = result[0].ImageURL;
    if (imagePath) {
      //const fullPath = path.join(__dirname, imagePath); // 絕對路徑
      deleteFile(imagePath); // 刪掉檔案
    }

    // 刪除貼文資料
    connection.query("DELETE FROM posts WHERE PostID=?", [postId], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  });
});

//刪除 uploads 圖片，用於刪除貼文或回覆時
function deleteFile(filePath) {
  filePath = 'public/' + filePath; //補上 public/
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error('刪除檔案失敗:', filePath, err.message);
    } else {
      console.log('檔案已刪除:', filePath);
    }
  });
}


// 對貼文按讚 / 取消按讚
app.post("/api/messages/:id/toggle-like", authMiddleware, (req, res) => {
  const postId = req.params.id;
  const userId = req.user.userId;
  connection.query("SELECT * FROM posts_likes WHERE PostID=? AND UserID=?", [postId, userId], (err, exists) => {
    if (err) return res.status(500).json({ error: err.message });
    if (exists.length > 0) {
      //已經按讚了，刪除一筆
      connection.query("DELETE FROM posts_likes WHERE PostID=? AND UserID=?", [postId, userId], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        return res.json({ success: true, liked: false });
      });
    }
    else {
      connection.query("INSERT INTO posts_likes (PostID, UserID) VALUES (?,?)", [postId, userId], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, liked: true });
      });
    }
  });
});

// 新增回覆
app.post("/api/messages/:id/comment", authMiddleware, (req, res) => {
  const postId = req.params.id;
  const userId = req.user.userId;
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: "Missing content" });
  connection.query("INSERT INTO comments (PostID, UserID, Content) VALUES (?,?,?)", [postId, userId, content], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    const commentId = result.insertId;
    connection.query("SELECT c.CommentID, u.Username AS Nickname, u.AvatarBase64 AS Avatar, c.Content, c.CreatedAt FROM comments c JOIN users u ON c.UserID=u.UserID WHERE c.CommentID=?", [commentId], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      const c = rows[0];
      res.json({ id: c.CommentID.toString(), nickname: c.Nickname, userAvatar: c.Avatar, content: c.Content, createdAt: c.CreatedAt, likes: 0, userId });
    });
  });
});

// 刪除回覆
app.delete("/api/messages/:postId/comment/:commentId", authMiddleware, (req, res) => {
  const commentId = req.params.commentId;
  connection.query("DELETE FROM comments WHERE CommentID=?", [commentId], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// 回覆按讚 / 取消按讚
app.post("/api/messages/:postId/comment/:commentId/toggle-like", authMiddleware, (req, res) => {
  const commentId = req.params.commentId;
  const userId = req.user.userId;
  connection.query("SELECT * FROM comments_likes WHERE CommentID=? AND UserID=?", [commentId, userId], (err, exists) => {
    if (err) return res.status(500).json({ error: err.message });
    if (exists.length > 0) {//已經按讚了，刪除一筆
      connection.query("DELETE FROM comments_likes WHERE CommentID=? AND UserID=?", [commentId, userId], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        return res.json({ success: true, liked: false });
      });
      return;
    }
    //還沒按讚，新增一筆
    else {
      connection.query("INSERT INTO comments_likes (CommentID, UserID) VALUES (?,?)", [commentId, userId], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, liked: true });
      });
    }
  });
});


// 啟動伺服器
app.listen(port, () => {
  console.log(`伺服器已啟動:http://localhost:${port}`);
});
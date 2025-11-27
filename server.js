const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const app = express();
const port = 3000;


// 解析 JSON
app.use(express.json());

// 解析 URL-encoded
app.use(express.urlencoded({ extended: true }));

// 提供靜態檔案 (HTML + 前端 JS)
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

const bcrypt = require('bcrypt');// 引入 bcrypt 套件以進行密碼雜湊

// 載入環境變數
require('dotenv').config({ path: path.join(__dirname, 'mySQLAccount(DoNotUpload).env') });
// 連線 MySQL
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
app.get('/fetch-users', (req, res) => {
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

      res.json({ message: '登入成功', user });
    }
  );
});

// 新增使用者帳號資料至 DataBase 的 users Table
app.post('/add-user', async (req, res) => {
  const { name, email, password } = req.body;
  //console.log('Received data:', req.body);

  // 將密碼 hash 後再存入資料庫
  const hashedPassword = await bcrypt.hash(password, 10);//salt rounds 設為 10

  const query = 'INSERT INTO users (Username, PasswordHash, Email) VALUES (?, ?, ?)';
  connection.query(query, [name, hashedPassword, email], (err, results) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ success: false, message: '新增使用者失敗' });
    }    
    if (err && err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Email 已存在' });
    }
    res.json({ success: true, message: '新增使用者成功' });
  });
});


// 啟動伺服器
app.listen(port, () => {
  console.log(`伺服器已啟動:http://localhost:${port}`);
});
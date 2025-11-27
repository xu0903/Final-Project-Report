-- 建立資料表
CREATE TABLE users (
    UserID INT AUTO_INCREMENT PRIMARY KEY,
    Username VARCHAR(50),
    Email VARCHAR(100) UNIQUE,
    PasswordHash VARCHAR(255),
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入初始使用者資料
INSERT INTO users (UserID, Username, PasswordHash, Email, CreatedAt)
VALUES (34, 'Demo', '$2b$10$MjSt9Jt5kbXFkTUOsd/Za.PzFkIw1kM.QnSgYGDJoP6NJMQHl/CDK', 'demo@fitmatch.dev', '2025-11-27 22:46:47');

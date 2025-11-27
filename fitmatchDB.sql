-- 建立資料表
CREATE TABLE users (
    UserID INT AUTO_INCREMENT PRIMARY KEY,
    Username VARCHAR(50) NOT NULL,
    PasswordHash VARCHAR(255) NOT NULL,
    Email VARCHAR(100) NOT NULL UNIQUE,
    Height INT,
    Weight INT,
    BMI DECIMAL(5,2),
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- 插入初始使用者資料
INSERT INTO users (UserID, Username, PasswordHash, Email, CreatedAt)
VALUES (34, 'Demo', '$2b$10$MjSt9Jt5kbXFkTUOsd/Za.PzFkIw1kM.QnSgYGDJoP6NJMQHl/CDK', 'demo@fitmatch.dev', '2025-11-27 22:46:47');

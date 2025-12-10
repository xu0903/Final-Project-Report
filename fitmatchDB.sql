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

CREATE TABLE tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('gender','color','style','other') NOT NULL,
    `key` VARCHAR(64) NOT NULL,       -- 程式用 key，例如 'male','pink','jp'
    label VARCHAR(64) NOT NULL,       -- 顯示用，例如 '男性','粉紅色','日系'
    UNIQUE KEY ux_tags_type_key (type, `key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE outfits (
    OutfitID INT AUTO_INCREMENT PRIMARY KEY,
    GenderKey ENUM('male','female','unisex') NOT NULL,
    GenderLabel VARCHAR(50) NOT NULL,
    StyleKey VARCHAR(50) NOT NULL,
    StyleLabel VARCHAR(50) NOT NULL,
    ColorKey VARCHAR(50) NOT NULL,
    ColorLabel VARCHAR(50) NOT NULL,
    Title VARCHAR(100) NOT NULL,
    Description VARCHAR(255),
    ImageURL VARCHAR(255)
);

CREATE TABLE user_favorites (
    UserID INT NOT NULL,
    OutfitID INT NOT NULL,
    FavoritedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (UserID, OutfitID),
    FOREIGN KEY (UserID) REFERENCES users(UserID),
    FOREIGN KEY (OutfitID) REFERENCES outfits(OutfitID)
);

CREATE TABLE outfitHistory (
    HistoryID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NOT NULL,
    OutfitID INT NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES users(UserID),
    FOREIGN KEY (OutfitID) REFERENCES outfits(OutfitID)
);



-- 插入初始使用者資料
INSERT INTO users (UserID, Username, PasswordHash, Email, CreatedAt)
VALUES (34, 'Demo', '$2b$10$MjSt9Jt5kbXFkTUOsd/Za.PzFkIw1kM.QnSgYGDJoP6NJMQHl/CDK', 'demo@fitmatch.dev', '2025-11-27 22:46:47');
-- 插入初始標籤資料
-- tags
INSERT INTO tags (type, `key`, label) VALUES
('gender','male','男性'),
('gender','female','女性'),
('gender','unisex','中性'),
('color','blue','藍色系'),
('color','brown','棕色系'),
('color','mono','黑白灰'),
('style','Sweet','甜美'),
('style','Minimalist','簡約'),
('style','Formal','正式'),
('style','Street','街頭');




CREATE TABLE posts (
PostID INT AUTO_INCREMENT PRIMARY KEY,
UserID INT NOT NULL,
Title VARCHAR(100),
Content TEXT NOT NULL,
ImageURL VARCHAR(255),
CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (UserID) REFERENCES users(UserID) ON DELETE CASCADE
);

CREATE TABLE posts_likes (
PostID INT NOT NULL,
UserID INT NOT NULL,
LikedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
PRIMARY KEY (PostID, UserID),
FOREIGN KEY (PostID) REFERENCES posts(PostID) ON DELETE CASCADE,
FOREIGN KEY (UserID) REFERENCES users(UserID) ON DELETE CASCADE
);

CREATE TABLE comments (
CommentID INT AUTO_INCREMENT PRIMARY KEY,
PostID INT NOT NULL,
UserID INT NOT NULL,
Content TEXT NOT NULL,
CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (PostID) REFERENCES posts(PostID) ON DELETE CASCADE,
FOREIGN KEY (UserID) REFERENCES users(UserID) ON DELETE CASCADE
);

CREATE TABLE comments_likes (
CommentID INT NOT NULL,
UserID INT NOT NULL,
LikedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
PRIMARY KEY (CommentID, UserID),
FOREIGN KEY (CommentID) REFERENCES comments(CommentID) ON
DELETE CASCADE,
FOREIGN KEY (UserID) REFERENCES users(UserID) ON DELETE CASCADE
);
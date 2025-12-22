-- 建立資料表
CREATE TABLE "users" (
  "UserID" int NOT NULL AUTO_INCREMENT,
  "Username" varchar(50) NOT NULL,
  "PasswordHash" varchar(255) NOT NULL,
  "Email" varchar(100) NOT NULL,
  "CreatedAt" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  "AvatarBase64" longtext,
  PRIMARY KEY ("UserID"),
  UNIQUE KEY "Email" ("Email")
);
CREATE TABLE "outfits" (
  "OutfitID" int NOT NULL AUTO_INCREMENT,
  "StyleKey" varchar(50) NOT NULL,
  "StyleLabel" varchar(50) NOT NULL,
  "ColorKey" varchar(50) NOT NULL,
  "ColorLabel" varchar(50) NOT NULL,
  "Title" varchar(100) NOT NULL,
  "Description" varchar(255) DEFAULT NULL,
  "ImageTop" varchar(255) DEFAULT NULL,
  "ImageHat" varchar(255) DEFAULT NULL,
  "ImageBottom" varchar(255) DEFAULT NULL,
  PRIMARY KEY ("OutfitID")
);
CREATE TABLE "user_favorites" (
  "favoriteID" int NOT NULL AUTO_INCREMENT,
  "UserID" int NOT NULL,
  "OutfitID" int NOT NULL,
  "FavoritedAt" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("favoriteID"),
  KEY "OutfitID" ("OutfitID"),
  KEY "user_favorites_ibfk_1" ("UserID"),
  CONSTRAINT "user_favorites_ibfk_1" FOREIGN KEY ("UserID") REFERENCES "users" ("UserID"),
  CONSTRAINT "user_favorites_ibfk_2" FOREIGN KEY ("OutfitID") REFERENCES "outfits" ("OutfitID")
);
CREATE TABLE "tags" (
  "id" int NOT NULL AUTO_INCREMENT,
  "type" enum('gender','color','style','other') NOT NULL,
  "key" varchar(64) NOT NULL,
  "label" varchar(64) NOT NULL,
  PRIMARY KEY ("id"),
  UNIQUE KEY "ux_tags_type_key" ("type","key")
);
CREATE TABLE "posts" (
  "PostID" int NOT NULL AUTO_INCREMENT,
  "UserID" int NOT NULL,
  "Title" varchar(100) DEFAULT NULL,
  "Content" text NOT NULL,
  "ImageURL" varchar(500) DEFAULT NULL,
  "CreatedAt" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("PostID"),
  KEY "UserID" ("UserID"),
  CONSTRAINT "posts_ibfk_1" FOREIGN KEY ("UserID") REFERENCES "users" ("UserID") ON DELETE CASCADE
);
CREATE TABLE "posts_likes" (
  "PostID" int NOT NULL,
  "UserID" int NOT NULL,
  "LikedAt" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("PostID","UserID"),
  KEY "UserID" ("UserID"),
  CONSTRAINT "posts_likes_ibfk_1" FOREIGN KEY ("PostID") REFERENCES "posts" ("PostID") ON DELETE CASCADE,
  CONSTRAINT "posts_likes_ibfk_2" FOREIGN KEY ("UserID") REFERENCES "users" ("UserID") ON DELETE CASCADE
);
CREATE TABLE "post_favorites" (
  "PostID" int NOT NULL,
  "FavoriteID" int NOT NULL,
  PRIMARY KEY ("PostID","FavoriteID"),
  KEY "FavoriteID" ("FavoriteID"),
  CONSTRAINT "post_favorites_ibfk_1" FOREIGN KEY ("PostID") REFERENCES "posts" ("PostID") ON DELETE CASCADE,
  CONSTRAINT "post_favorites_ibfk_2" FOREIGN KEY ("FavoriteID") REFERENCES "user_favorites" ("favoriteID") ON DELETE CASCADE
);
CREATE TABLE "comments" (
  "CommentID" int NOT NULL AUTO_INCREMENT,
  "PostID" int NOT NULL,
  "UserID" int NOT NULL,
  "Content" text NOT NULL,
  "CreatedAt" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("CommentID"),
  KEY "PostID" ("PostID"),
  KEY "UserID" ("UserID"),
  CONSTRAINT "comments_ibfk_1" FOREIGN KEY ("PostID") REFERENCES "posts" ("PostID") ON DELETE CASCADE,
  CONSTRAINT "comments_ibfk_2" FOREIGN KEY ("UserID") REFERENCES "users" ("UserID") ON DELETE CASCADE
);
CREATE TABLE "comments_likes" (
  "CommentID" int NOT NULL,
  "UserID" int NOT NULL,
  "LikedAt" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("CommentID","UserID"),
  KEY "UserID" ("UserID"),
  CONSTRAINT "comments_likes_ibfk_1" FOREIGN KEY ("CommentID") REFERENCES "comments" ("CommentID") ON DELETE CASCADE,
  CONSTRAINT "comments_likes_ibfk_2" FOREIGN KEY ("UserID") REFERENCES "users" ("UserID") ON DELETE CASCADE
);
CREATE TABLE "outfitHistory" (
  "HistoryID" int NOT NULL AUTO_INCREMENT,
  "UserID" int NOT NULL,
  "OutfitID" int NOT NULL,
  "CreatedAt" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("HistoryID"),
  KEY "UserID" ("UserID"),
  KEY "OutfitID" ("OutfitID"),
  CONSTRAINT "outfitHistory_ibfk_1" FOREIGN KEY ("UserID") REFERENCES "users" ("UserID"),
  CONSTRAINT "outfitHistory_ibfk_2" FOREIGN KEY ("OutfitID") REFERENCES "outfits" ("OutfitID")
);



-- 插入初始使用者資料
INSERT INTO users (UserID, Username, PasswordHash, Email, CreatedAt)
VALUES (1, 'Demo', '$2b$10$MjSt9Jt5kbXFkTUOsd/Za.PzFkIw1kM.QnSgYGDJoP6NJMQHl/CDK', 'demo@fitmatch.dev', '2025-11-27 22:46:47');
-- 插入初始標籤資料
-- tags
INSERT INTO tags (type, `key`, label) VALUES
('color','blue','藍色系'),
('color','brown','棕色系'),
('color','blackgraywhite','黑白灰'),
('style','Sweet','甜美'),
('style','Minimalist','簡約'),
('style','Formal','正式'),
('style','Street','街頭');
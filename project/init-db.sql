CREATE DATABASE IF NOT EXISTS Canchu;
GRANT SELECT, DELETE, UPDATE, INSERT ON Canchu.* TO 'root'@'%';
use Canchu

/* create users table */
CREATE TABLE IF NOT EXISTS users (
    id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    provider varchar(20),
    name varchar(30) NOT NULL,
    email varchar(50) NOT NULL,
    picture varchar(255),
    password varchar(255) NOT NULL,
    introduction text,
    tags varchar(50),
    friend_count INT NOT NULL default 0
);

/* create friendship table */
CREATE TABLE IF NOT EXISTS friendship (
    id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    user1_id INT NOT NULL,
    user2_id INT NOT NULL,
    date varchar(30),
    status varchar(20) NOT NULL,
    FOREIGN KEY (user1_id) REFERENCES users(id),
    FOREIGN KEY (user2_id) REFERENCES users(id)
);

/* create events table */
CREATE TABLE IF NOT EXISTS events (
    id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    type varchar(20) NOT NULL,
    is_read BOOL NOT NULL,  
    image varchar(255),
    created_at varchar(30) NOT NULL,
    summary TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

/* create posts table */
CREATE TABLE IF NOT EXISTS posts (
    id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    context TEXT NOT NULL,
    like_count INT NOT NULL default 0,
    comment_count INT NOT NULL default 0,
    created_at varchar(30) NOT NULL,
    summary TEXT
);

/* create posts table */
CREATE TABLE IF NOT EXISTS posts (
    id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    context TEXT NOT NULL,
    like_count INT NOT NULL default 0,
    comment_count INT NOT NULL default 0,
    created_at varchar(30) NOT NULL,
    summary TEXT
);

/* create post_likes table */
CREATE TABLE IF NOT EXISTS post_likes (
    id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    post_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (post_id) REFERENCES posts(id)
);

/* create post_comments table */
CREATE TABLE IF NOT EXISTS post_comments (
    id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    post_id INT NOT NULL,
    content TEXT NOT NULL,
    created_at varchar(30) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (post_id) REFERENCES posts(id)
);

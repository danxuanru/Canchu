# build Event API

* create event table
    ```sql
    CREATE TABLE events (
        id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
        type varchar(20) NOT NULL,
        is_read BOOL NOT NULL,  
        image varchar(255),
        created_at varchar(30) NOT NULL,
        summary TEXT,
        user_id INT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
    ```

* **add new events**
    * read event
    * friend_request 
    * agree_request
    * delete_friend

# build Event API

* create event table
    ```sql
    CREATE TABLE events (
        id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
        type varchar(20) NOT NULL,
        is_read BIT NOT NULL,  
        image varchar(255),
        created_at DATE,
        summary TEXT
    )
    ```
    mysql中 boolean型態由BIT表示

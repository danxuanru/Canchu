# AWS EC2
[website](http://3.24.21.167/)

* ### Create instance
* ### Associate Elastic IP with Instance
* ### Connect
    `ssh....`輸入至用戶端

    🔑key 需要在同一資料夾

`

* ### binding to 80 port
    > 反向代理 Reverse Proxy: NGINX
    
    修改設定檔: `/etc/nginx/nginx.conf`

    add sever{}
    ```
    server{
        listen 80; 
        server_name 3.24.21.167;
        location / {
                proxy_pass http://0.0.0.0:5000;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $http_x_forwarded_proto;
        }
    }
    ```

    ```
    sudo systemctl (re)start nginx
    ```

    ❗ AWS security group的傳入規則需要開啟port-80

`

* ### run web server in the background
    * use `pm2`
        ```
        sudo npm install -g pm2
        ```
        ```
        pm2 start server.js
        ```
        set pm2 start on system boot
        ```
        pm2 startup
        ```

        close & delete
        ```
        pm2 stop server (js檔名)
        pm2 delete server
        ```

        moniter 
        ```
        pm2 monit
        ```
---
* ### **MySQL server**
    install
    ```
    sudo apt install mysql-server
    ```

    ```
    sudo systemctl start mysql

    sudo systemctl enable mysql
    ```
    login to MySQL server 
    ```
    mysql -u root -p
    ```

    --

    **DATABASE** stylish
    ```
    CREATE DATABASE stylish
    ```

    switch database
    ```
    use stylish
    ```

    **TABLE** products 
    | Field  |	Type | Null  |	Key |	Extra |
    |-------|------|-----|-----|----|
    | id |	bigint unsigned	| no |	primary |	auto_increment |
    | title |	varchar(255) |	no	|
    ```
    CREATE TABLE products (
        id brigint unsigned NOT NULL, PRIMARY KEY AUTO_INCREMENT,
        title varchar(255) NOT NULL
    );
    ```

---
## Discussion
1. What is the purpose of Elastic IP?
2. How can a program be run in the background?
3. What should be taken into consideration when installing MySQL?

    [recap ](https://docs.google.com/presentation/d/15uL6aOXxEM0jRdPA7eiqjqPesxJ6p6YsJExNetmCbnY/edit#slide=id.g22eceb0bbcd_0_210)
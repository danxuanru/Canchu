# build Search API

* Query Parameters
    req.query.keyword

* SQL搜尋關鍵字
    ```sql
    SELECT * FROM users WHERE name LIKE '%${keyword}%'
    ```

* **getFriendship** (model)
    > 獲取user與自己的`friedship object`
    
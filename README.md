---
## build Profile API

### 功能
* ### **multer**
    ```js
    const multer = require('multer');

    const storage = multer.diskStorage({
        /* configuring storage */
        // destination: determines the folder where the uploaded files will be stored
        destination: (req, file, cb) => {
            cb(null, 'static/');
        },
        filename: (req, file, cb) => {
            file.originalname // get full path
        }
    });

    const upload = multer({ storage });  // instance
    upload.single('');  //
    ```

request: img file & header

    

### Practice
* add TABLE column
    ```sql
    ALTER TABLE users 
    ADD introduction TEXT,
    ADD tags VARCHAR(50);
    ADD friend_count INT
    ```

* upload an image file to EC2

---



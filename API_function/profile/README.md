# build Profile API

* EC2上的版本問題

    *error message:*
    ```
    #initializeTTLTracking() {
                          ^
    SyntaxError: Unexpected token '('
        at wrapSafe (internal/modules/cjs/loader.js:915:16)
        at Module._compile (internal/modules/cjs/loader.js:963:27)
        at Object.Module._extensions..js (internal/modules/cjs/loader.js:1027:10)
        at Module.load (internal/modules/cjs/loader.js:863:32)
        at Function.Module._load (internal/modules/cjs/loader.js:708:14)
        at Module.require (internal/modules/cjs/loader.js:887:19)
        at require (internal/modules/cjs/helpers.js:74:18)
        at Object.<anonymous> (/home/ubuntu/node_modules/lru-cache/dist/cjs/index-cjs.js:5:36)
        at Module._compile (internal/modules/cjs/loader.js:999:30)
        at Object.Module._extensions..js (internal/modules/cjs/loader.js:1027:10)
    ```

    npm安裝的nodejs為v12.22.9 但許多套件都需要v15以上
    
    🔑 使用nvm   [參考資料](https://tecadmin.net/how-to-install-nvm-on-ubuntu-20-04/)
    ```
    $ sudo apt update 

    $ curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash

    // 要覆蓋&刪除原有的npm 需要加上這兩步
    nvm use system
    npm uninstall -g a_module

    ```
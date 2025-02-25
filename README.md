## 啟動方式

1. 安裝相依套件

```
npm ci
```

2. 設定環境變數

使用Docker開發：
```
POSTGRES_USER=testHexschool
POSTGRES_PASSWORD=pgStartkit4test
POSTGRES_DB=test
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=testHexschool
DB_PASSWORD=pgStartkit4test
DB_DATABASE=test
DB_SYNCHRONIZE=true
DB_ENABLE_SSL=false
PORT=8080
LOG_LEVEL=debug
JWT_EXPIRES_DAY=30d
JWT_SECRET=hexschool666
```

使用localhost開發伺服器（資料庫仍使用Docker）：
```
POSTGRES_USER=testHexschool
POSTGRES_PASSWORD=pgStartkit4test
POSTGRES_DB=test
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=testHexschool
DB_PASSWORD=pgStartkit4test
DB_DATABASE=test
DB_SYNCHRONIZE=true
DB_ENABLE_SSL=false
PORT=8080
LOG_LEVEL=debug
JWT_EXPIRES_DAY=30d
JWT_SECRET=hexschool666
```

## 開發指令

- `npm run dev` - 啟動開發伺服器
- `npm run start` - 啟動伺服器與資料庫
- `npm run restart` - 重新啟動伺服器與資料庫
- `npm run stop` - 關閉啟動伺服器與資料庫
- `npm run clean` - 關閉伺服器與資料庫並清除所有資料

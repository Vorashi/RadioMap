# 🚀 Как начать работу с проектом:

Установить проект и сделать эту команду в терминале:
```JavaScript
    npm install
 ```
после этого можно будет запустить сервер командой
```JavaScript
    npm run start
```

## 💪 Как запустить фронтенд:

перейдите в новую папку

```
 mkdir "ваше название"
 cd "ваше название"
```
вновь подгрузите зависимости для прокта
```JS
    npm install
 ```
после этого можно прописать 
```JavaScript
    npm run start 
 ```
 или
 ```JavaScript
    npm run build
 ```
 Всё готово, преходите по порту 3000, и наслаждайтесь http://localhost:3000

## 💡 Можно покидать запросы

```HTTP
POST /set-folder HTTP/1.1
Host: localhost:5000
Content-Type: application/json
Content-Length: 49

{
    "folderPath": "C:/Sharov/GraphApp/data"
}
```
```HTTP
GET /files HTTP/1.1
Host: localhost:5000
```
```HTTP
GET /file/date.json HTTP/1.1
Host: localhost:5000
```
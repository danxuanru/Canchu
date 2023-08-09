FROM node:16-alpine

# Use production node environment by default.
ENV NODE_ENV production

WORKDIR /canchu

# 複製 package.json package-lock.json 安裝相依套件
COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5000

# install pm2
#RUN npm install pm2 -g
RUN npm install jest -g

COPY .env ./
# copy database script
COPY init-db.sql ./

# Run the application.
# CMD pm2-runtime start server.js

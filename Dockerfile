# 使用官方 Node 轻量镜像
FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json 并安装依赖
COPY package*.json ./
RUN npm ci --omit=dev

# 复制剩余文件
COPY . .

# 运行端口（Cloud Run 默认监听 8080）
EXPOSE 8080

# 启动服务
CMD ["node", "server.js"]


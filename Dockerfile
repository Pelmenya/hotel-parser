# Используем базовый образ Node.js
FROM node:20

# Install necessary libraries for Puppeteer
RUN apt-get update && apt-get install -y \
libnss3 \
    libatk-bridge2.0-0 \
    libx11-xcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxi6 \
    libxtst6 \
    libnss3 \
    libxrandr2 \
    libxss1 \
    libasound2 \
    libcups2 \
    libxshmfence1 \
    libglu1-mesa \
    libdrm2 \
    libxkbcommon0 \  
    libgbm-dev \
    --no-install-recommends && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install -f

# Копируем все файлы проекта
COPY . .

# Запускаем приложение
CMD ["sh", "-c", "npm run start:dev"]


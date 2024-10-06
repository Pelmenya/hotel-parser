# Используем базовый образ Node.js
FROM node:18.20.4

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install -f

# Копируем все файлы проекта
COPY . .

# Собираем проект
RUN npm run build

# Запускаем приложение
CMD ["npm", "run", "start:prod"]

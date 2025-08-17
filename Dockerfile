# Stage 1: Build Angular
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .

# Build Angular en producción
RUN npm run build -- --configuration=production

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copia archivos compilados
COPY --from=build /app/dist/frontend /usr/share/nginx/html

# Copia configuración nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

# Stage 1: Build Angular
FROM node:20-alpine AS build
WORKDIR /app

# Copia package.json y package-lock.json
COPY package*.json ./

# Instala dependencias
RUN npm install

# Copia el resto del código
COPY . .

# Construye Angular en modo producción (corregido)
RUN ng build --configuration=production

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copia los archivos de Angular compilados
COPY --from=build /app/dist/frontend /usr/share/nginx/html

# Copia la configuración de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expone el puerto 80
EXPOSE 80

# Comando para iniciar nginx
CMD ["nginx", "-g", "daemon off;"]

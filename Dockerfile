# Usa una imagen base oficial de Node.js
FROM node:20

# Establece el directorio de trabajo
WORKDIR /app

# Copia package.json y package-lock.json
COPY package*.json ./

# Instala dependencias globales (incluye Angular CLI si es necesario)
RUN npm install -g @angular/cli

# Instala dependencias del proyecto
RUN npm install --legacy-peer-deps

# Copia el resto del código
COPY . .

# Construye la aplicación Angular
RUN ng build

# Expone el puerto que usa Cloud Run (por defecto 8080)
EXPOSE 8080

# Configura la variable de entorno PORT
ENV PORT=8080

# Comando para iniciar la aplicación
CMD ["node", "server.js"]
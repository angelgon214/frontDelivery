const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

const distPath = path.join(__dirname, 'dist/frontend');
console.log('Verificando carpeta dist: ' + distPath);

if (!fs.existsSync(distPath)) {
  console.error('Error: La carpeta dist/frontend no existe');
  process.exit(1);
} else {
  console.log('Carpeta dist/frontend encontrada');
}

app.use(express.static(distPath));

app.get('/*', (req, res) => {
  console.log('Solicitud recibida para: ' + req.url);
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      console.error('Error al servir index.html:', err);
      res.status(500).send('Error al cargar la aplicación');
    }
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
}).on('error', (err) => {
  console.error('Error al iniciar el servidor:', err.message);
  process.exit(1);
});
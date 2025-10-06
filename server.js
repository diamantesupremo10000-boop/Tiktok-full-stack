/**
 * server.js
 * - Servidor Express mínimo
 * - Sirve archivos estáticos desde /public
 * - API REST simple: GET /api/articles, POST /api/articles
 * - Simula conexión a MongoDB usando database.js (in-memory)
 *
 * USO:
 *  1. npm install
 *  2. npm start
 *
 * Nota: es intencionadamente simple y sin autenticación (demo).
 */

const path = require('path');
const express = require('express');
const db = require('./database'); // simulador "MongoDB"

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json({ limit: '1mb' })); // parse application/json
app.use(express.urlencoded({ extended: true }));

// Servir carpeta pública (index.html, styles.css, app.js)
app.use(express.static(path.join(__dirname, 'public')));

// ---------- API ----------

// Get all articles (list)
app.get('/api/articles', async (req, res) => {
  try {
    const articles = await db.getArticles();
    // ordenar por creadoAt descendente
    articles.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ ok: true, data: articles });
  } catch (err) {
    console.error('GET /api/articles error:', err);
    res.status(500).json({ ok: false, error: 'Error interno' });
  }
});

// Create new article
app.post('/api/articles', async (req, res) => {
  try {
    const { title, description, author, views } = req.body;

    // Validación mínima
    if (!title || typeof title !== 'string' || title.trim().length < 2) {
      return res.status(400).json({ ok: false, error: 'Título inválido' });
    }

    const newArticle = {
      title: title.trim(),
      description: (description || '').trim(),
      author: (author || 'Anónimo').trim(),
      views: Number.isFinite(Number(views)) ? Math.max(0, Math.floor(Number(views))) : 0
    };

    const created = await db.addArticle(newArticle);
    res.status(201).json({ ok: true, data: created });
  } catch (err) {
    console.error('POST /api/articles error:', err);
    res.status(500).json({ ok: false, error: 'Error interno' });
  }
});

// Fallback para SPA / rutas no capturadas (opcional)
// Si prefieres 404, cámbialo. Aquí servimos index.html para que el frontend maneje rutas.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar "conexión" simulada y servidor
(async function start() {
  try {
    await db.connect(); // simulación
    app.listen(PORT, () => {
      console.log(`Servidor iniciado en http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Error iniciando servidor:', err);
    process.exit(1);
  }
})();
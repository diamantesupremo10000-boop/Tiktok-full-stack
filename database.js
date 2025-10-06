/**
 * database.js
 * - Simula un cliente/colección MongoDB en memoria
 * - Exporta funciones async: connect(), getArticles(), addArticle()
 *
 * Diseño:
 * - Mantiene un array interno "articles"
 * - addArticle añade id incremental tipo ObjectId-like y createdAt
 *
 * Propósito:
 * - Permitir cambiar luego por una implementación real de MongoDB cambiando los métodos.
 */

const { randomUUID } = require('crypto');

let _connected = false;
let _articles = []; // almacenamiento en memoria

function nowISO() {
  return new Date().toISOString();
}

module.exports = {
  // Simula conectar a la base de datos (async para compatibilidad)
  connect: async function () {
    if (_connected) return;
    // Seed inicial con ejemplos
    _articles = [
      {
        _id: String(randomUUID()),
        title: 'Atardecer en la ciudad',
        description: 'Un clip corto mostrando luces y movimiento. Minimalismo, ritmo y color.',
        author: 'UsuarioDemo',
        views: 2100,
        likes: 128,
        createdAt: nowISO()
      },
      {
        _id: String(randomUUID()),
        title: 'Cocina express',
        description: 'Recetas rápidas, limpias y con ritmo. Ideal para la semana.',
        author: 'ChefDemo',
        views: 15000,
        likes: 3200,
        createdAt: nowISO()
      },
      {
        _id: String(randomUUID()),
        title: 'Rutina matutina',
        description: 'Pequeños hábitos, gran impacto. 5 pasos en 30s.',
        author: 'LifeDemo',
        views: 4500,
        likes: 640,
        createdAt: nowISO()
      }
    ];
    _connected = true;
    console.log('Base de datos simulada iniciada (in-memory).');
  },

  getArticles: async function () {
    if (!_connected) throw new Error('DB no conectada');
    // devolvemos copia para evitar mutaciones externas
    return _articles.map(a => ({ ...a }));
  },

  addArticle: async function (doc) {
    if (!_connected) throw new Error('DB no conectada');
    const now = nowISO();
    const newDoc = {
      _id: String(randomUUID()),
      title: doc.title,
      description: doc.description || '',
      author: doc.author || 'Anónimo',
      views: Number.isFinite(Number(doc.views)) ? Math.max(0, Math.floor(Number(doc.views))) : 0,
      likes: 0,
      createdAt: now
    };
    _articles.push(newDoc);
    return { ...newDoc };
  },

  // útil para testing
  clear: async function () {
    _articles = [];
  }
};
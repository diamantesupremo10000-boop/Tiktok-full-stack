/**
 * app.js (frontend)
 * - Obtiene artículos desde /api/articles y los renderiza
 * - Permite crear nuevos artículos vía formulario POST /api/articles
 * - Toggle mobile menu y upload form
 * - IntersectionObserver para reveal animación
 * - Delegación para like buttons
 *
 * Comentarios incluidos para cada bloque.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elementos clave
  const menuToggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const searchInput = document.getElementById('search');
  const feed = document.getElementById('feed');
  const loading = document.getElementById('loading');
  const yearEl = document.getElementById('year');

  // Upload form elements
  const uploadBtn = document.getElementById('uploadBtn');
  const uploadSection = document.getElementById('uploadSection');
  const uploadForm = document.getElementById('uploadForm');
  const cancelUpload = document.getElementById('cancelUpload');
  const uploadMsg = document.getElementById('uploadMsg');

  yearEl.textContent = new Date().getFullYear();

  // Toggle mobile menu
  menuToggle.addEventListener('click', () => {
    const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!expanded));
    if (mobileMenu.hasAttribute('hidden')) mobileMenu.removeAttribute('hidden');
    else mobileMenu.setAttribute('hidden', '');
  });

  // Toggle upload form
  uploadBtn.addEventListener('click', () => {
    const expanded = uploadBtn.getAttribute('aria-expanded') === 'true';
    uploadBtn.setAttribute('aria-expanded', String(!expanded));
    if (uploadSection.hasAttribute('hidden')) uploadSection.removeAttribute('hidden');
    else uploadSection.setAttribute('hidden', '');
  });

  cancelUpload.addEventListener('click', () => {
    uploadSection.setAttribute('hidden', '');
    uploadBtn.setAttribute('aria-expanded', 'false');
  });

  // IntersectionObserver para reveal
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  // Render helper: crea el DOM de una card a partir de un article object
  function renderArticleDOM(article) {
    const articleEl = document.createElement('article');
    articleEl.className = 'card reveal';
    articleEl.setAttribute('tabindex', '0');
    articleEl.dataset.title = article.title || '';

    // media (placeholder SVG con texto)
    const mediaHTML = `
      <div class="media" aria-hidden="true">
        <svg class="media-placeholder" viewBox="0 0 800 450" role="img" aria-label="${escapeHtml(article.title)}">
          <rect width="100%" height="100%" fill="#071018"></rect>
          <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="32" fill="#7fb0ff">${escapeHtml(article.title)}</text>
        </svg>
      </div>
    `;

    const bodyHTML = `
      <div class="card-body">
        <header class="card-header">
          <div class="author">
            <span class="avatar" aria-hidden="true">🔹</span>
            <div>
              <strong class="author-name">${escapeHtml(article.author || 'Anónimo')}</strong>
              <div class="meta">${Number(article.views || 0).toLocaleString()} reproducciones · ${new Date(article.createdAt || Date.now()).toLocaleDateString()}</div>
            </div>
          </div>
          <button class="btn btn-ghost btn-small follow">Seguir</button>
        </header>

        <div class="card-content">
          <h2 class="card-title">${escapeHtml(article.title)}</h2>
          <p class="card-desc">${escapeHtml(article.description || '')}</p>
        </div>

        <footer class="card-footer">
          <div class="actions-row">
            <button class="btn icon-like" aria-pressed="false" aria-label="Me gusta">
              <span class="like-count">${Number(article.likes || 0).toLocaleString()}</span>
            </button>
            <button class="btn btn-ghost" aria-label="Compartir">Compartir</button>
            <button class="btn btn-ghost" aria-label="Comentarios">Comentarios</button>
          </div>
        </footer>
      </div>
    `;

    articleEl.innerHTML = mediaHTML + bodyHTML;
    return articleEl;
  }

  // Escape básico para inyectar texto seguro en innerHTML
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // Fetch artículos desde API y render
  async function fetchAndRenderArticles() {
    try {
      const res = await fetch('/api/articles', { cache: 'no-store' });
      if (!res.ok) throw new Error('Error cargando artículos');
      const payload = await res.json();
      if (!payload.ok) throw new Error('Formato inválido');
      const articles = payload.data || [];

      // Limpiar feed y cargar
      feed.innerHTML = '';
      if (articles.length === 0) {
        const none = document.createElement('div');
        none.className = 'no-results';
        none.textContent = 'Sin contenido.';
        feed.appendChild(none);
        return;
      }

      // Crear y añadir cards
      articles.forEach(article => {
        const el = renderArticleDOM(article);
        feed.appendChild(el);
        io.observe(el);
      });
    } catch (err) {
      console.error(err);
      feed.innerHTML = `<div class="no-results">No se pudo cargar el contenido.</div>`;
    }
  }

  // Inicializar carga
  fetchAndRenderArticles();

  // Delegación: manejar likes dentro del feed
  feed.addEventListener('click', (e) => {
    const likeBtn = e.target.closest('.icon-like');
    if (!likeBtn) return;

    const pressed = likeBtn.getAttribute('aria-pressed') === 'true';
    likeBtn.setAttribute('aria-pressed', String(!pressed));

    likeBtn.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }, { transform:'scale(1)' }],
      { duration: 260, easing: 'cubic-bezier(.2,.9,.3,1)' }
    );

    const count = likeBtn.querySelector('.like-count');
    if (!count) return;
    const raw = count.textContent.replace(/[^\d]/g, '');
    let n = parseInt(raw || '0', 10);
    if (!pressed) n = n + 1; else n = Math.max(0, n - 1);
    count.textContent = n.toLocaleString();
  });

  // BUSCADOR en vivo simple (filtrado en el DOM)
  searchInput.addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    const cards = Array.from(feed.querySelectorAll('.card'));
    let visible = 0;
    cards.forEach(card => {
      const title = (card.dataset.title || '').toLowerCase();
      const desc = (card.querySelector('.card-desc')?.textContent || '').toLowerCase();
      const match = title.includes(q) || desc.includes(q);
      card.hidden = !match;
      if (match) visible++;
    });
    // Mensaje cuando no hay resultados
    const existingNone = feed.querySelector('.no-results');
    if (visible === 0) {
      if (!existingNone) {
        const no = document.createElement('div');
        no.className = 'no-results';
        no.textContent = 'Sin resultados.';
        feed.appendChild(no);
      }
    } else {
      if (existingNone) existingNone.remove();
    }
  });

  // Manejo del submit del formulario (crear nuevo artículo)
  uploadForm.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    uploadMsg.hidden = true;
    uploadMsg.textContent = '';

    const formData = new FormData(uploadForm);
    const payload = {
      title: (formData.get('title') || '').toString().trim(),
      description: (formData.get('description') || '').toString().trim(),
      author: (formData.get('author') || '').toString().trim(),
      views: Number(formData.get('views') || 0)
    };

    // Validación mínima cliente
    if (!payload.title || payload.title.length < 2) {
      uploadMsg.hidden = false;
      uploadMsg.textContent = 'El título debe tener al menos 2 caracteres.';
      return;
    }

    // Petición POST
    try {
      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json?.error || 'Error creando artículo');
      }

      // Prepend nuevo artículo al feed y observarlo
      const newArticle = json.data;
      const node = renderArticleDOM(newArticle);
      feed.prepend(node);
      io.observe(node);

      // Reset formulario y mensajito
      uploadForm.reset();
      uploadMsg.hidden = false;
      uploadMsg.textContent = 'Artículo creado correctamente.';
      setTimeout(() => { uploadMsg.hidden = true; uploadSection.setAttribute('hidden', ''); uploadBtn.setAttribute('aria-expanded', 'false'); }, 1100);
    } catch (err) {
      console.error(err);
      uploadMsg.hidden = false;
      uploadMsg.textContent = 'No se pudo crear el artículo. Intenta de nuevo.';
    }
  });

  // Pequeña mejora UX: cerrar menú cuando se redimensiona
  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) {
      mobileMenu.setAttribute('hidden', '');
      menuToggle.setAttribute('aria-expanded', 'false');
    }
  });

});
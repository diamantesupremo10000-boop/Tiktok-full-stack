/* app.js
   Interactividad mínima:
   - Toggle menú móvil
   - Búsqueda en vivo (filtra por title/data-title)
   - IntersectionObserver para reveal on scroll (animación suave)
   - Like button toggles con animación simple y actualización de contador
   - Inserta año actual en footer
*/

/* -------------------------
   Helpers
   ------------------------- */
// seleccionamos elementos clave
const menuToggle = document.getElementById('menuToggle');
const mobileMenu = document.getElementById('mobileMenu');
const searchInput = document.getElementById('search');
const feed = document.getElementById('feed');
const noResults = document.getElementById('noResults');
const yearEl = document.getElementById('year');

yearEl.textContent = new Date().getFullYear(); // actualiza año del footer

/* -------------------------
   Menu móvil
   - accesibilidad: aria-expanded y hidden attribute
   ------------------------- */
menuToggle.addEventListener('click', () => {
  const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!expanded));
  if (mobileMenu.hasAttribute('hidden')) {
    mobileMenu.removeAttribute('hidden');
  } else {
    mobileMenu.setAttribute('hidden', '');
  }
});

/* Cerrar menu al cambiar tamaño grande (mejor UX) */
window.addEventListener('resize', () => {
  if (window.innerWidth > 900) {
    mobileMenu.setAttribute('hidden', '');
    menuToggle.setAttribute('aria-expanded', 'false');
  }
});

/* -------------------------
   Reveal on scroll: IntersectionObserver
   ------------------------- */
const revealElements = document.querySelectorAll('.reveal');
const ioOptions = { root: null, rootMargin: '0px', threshold: 0.12 };

const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      // once visible, unobserve to improve performance
      io.unobserve(entry.target);
    }
  });
}, ioOptions);

revealElements.forEach(el => io.observe(el));

/* -------------------------
   Like button logic
   - delegación de eventos: más eficiente
   ------------------------- */
feed.addEventListener('click', (e) => {
  const likeBtn = e.target.closest('.icon-like');
  if (!likeBtn) return;

  // toggle pressed state
  const pressed = likeBtn.getAttribute('aria-pressed') === 'true';
  likeBtn.setAttribute('aria-pressed', String(!pressed));

  // animación breve: escala
  likeBtn.animate(
    [{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }, { transform:'scale(1)' }],
    { duration: 320, easing: 'cubic-bezier(.2,.9,.3,1)' }
  );

  // actualizar contador (leer y sumar o restar)
  const countSpan = likeBtn.querySelector('.like-count');
  if (!countSpan) return;
  // usando parseInt con base 10; números con coma/puntos no esperados, así que limpiamos
  const raw = countSpan.textContent.replace(/[^\d]/g, '');
  let num = parseInt(raw || '0', 10);
  if (!pressed) {
    num = num + 1;
  } else {
    num = Math.max(0, num - 1);
  }
  // formateo simple (sin dependencias)
  countSpan.textContent = num.toLocaleString();
});

/* -------------------------
   Búsqueda en vivo (filtro simple)
   - filtra por atributo data-title del article
   - no hace búsquedas complejas para mantener rendimiento
   ------------------------- */
searchInput.addEventListener('input', (e) => {
  const q = e.target.value.trim().toLowerCase();
  const cards = Array.from(feed.querySelectorAll('.card'));
  let visibleCount = 0;

  if (!q) {
    // si query vacía, mostramos todos
    cards.forEach(card => {
      card.hidden = false;
      card.classList.remove('is-visible'); // reset reveal for UX (optional)
      // volver a observar para animación si deseas (pero no necesario)
      // io.observe(card);
    });
    visibleCount = cards.length;
  } else {
    cards.forEach(card => {
      const title = (card.dataset.title || '').toLowerCase();
      const body = (card.querySelector('.card-desc')?.textContent || '').toLowerCase();
      const matches = title.includes(q) || body.includes(q);
      card.hidden = !matches;
      if (!card.hidden) {
        visibleCount++;
        // añadir clase is-visible si aún no visible (para usuarios que filtran rápido)
        card.classList.add('is-visible');
      }
    });
  }

  noResults.hidden = visibleCount !== 0;
});

/* -------------------------
   Progressive enhancement: keyboard accessibility
   - permitir "enter" en tarjetas para enfocarlas o reproducir (demo)
   ------------------------- */
feed.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  const card = e.target.closest('.card');
  if (!card) return;
  // enfoque sencillo: despliega el contenido (navegación demo)
  card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  card.classList.add('is-visible');
});

/* -------------------------
   Nota final de optimización:
   - Todas las imágenes son SVG inline para evitar peticiones externas.
   - IntersectionObserver se usa para revelar y reducir work when out of view.
   - Event delegation reduce listeners por card.
   ------------------------- */
// Carrusel de "Bases del torneo" (pantallas ≥ 768 px; en móvil se usa el acordeón). Las tarjetas ya vienen en el HTML.
export function iniciarCarrusel(): void {
  const contenedor = document.getElementById('carousel-container');
  const pista = document.getElementById('carousel-track');
  if (!contenedor || !pista) return;
  const tarjetas = pista.querySelectorAll('.carousel-card');
  const prev = document.getElementById('carousel-prev');
  const next = document.getElementById('carousel-next');
  const indicadores = document.getElementById('carousel-indicators');
  let actual = 0;
  let auto: ReturnType<typeof setInterval> | null = null;
  let reinicio: ReturnType<typeof setTimeout> | null = null;

  const visibles = () => (window.innerWidth >= 1024 ? 3 : window.innerWidth >= 768 ? 2 : 1);

  function actualizar() {
    const ancho = 100 / visibles();
    // La tarjeta activa queda centrada
    pista!.style.transform = `translateX(${50 - actual * ancho - ancho / 2}%)`;
    indicadores?.querySelectorAll('.carousel-indicator').forEach((el, i) => {
      el.classList.toggle('bg-brand-blue', i === actual);
      el.classList.toggle('w-8', i === actual);
      el.classList.toggle('bg-gray-300', i !== actual);
      el.classList.toggle('w-3', i !== actual);
    });
  }
  function ir(i: number) {
    actual = i < 0 ? tarjetas.length - 1 : i >= tarjetas.length ? 0 : i;
    actualizar();
    detener();
    reinicio = setTimeout(arrancar, 4000);
  }
  function arrancar() { detener(); auto = setInterval(() => ir(actual + 1), 4000); }
  function detener() {
    if (auto) clearInterval(auto);
    if (reinicio) clearTimeout(reinicio);
    auto = reinicio = null;
  }

  if (indicadores) {
    tarjetas.forEach((_, i) => {
      const b = document.createElement('button');
      b.className = 'carousel-indicator w-3 h-3 rounded-full transition-all duration-300 bg-gray-300 hover:bg-gray-400';
      b.setAttribute('aria-label', `Ir a slide ${i + 1}`);
      b.addEventListener('click', () => ir(i));
      indicadores.appendChild(b);
    });
  }
  prev?.addEventListener('click', () => ir(actual - 1));
  next?.addEventListener('click', () => ir(actual + 1));
  contenedor.addEventListener('mouseenter', detener);
  contenedor.addEventListener('mouseleave', arrancar);
  document.addEventListener('keydown', (e) => {
    if (!contenedor.contains(document.activeElement)) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); ir(actual - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); ir(actual + 1); }
  });
  let t: ReturnType<typeof setTimeout>;
  window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(actualizar, 250); });
  actualizar();
  arrancar();
}

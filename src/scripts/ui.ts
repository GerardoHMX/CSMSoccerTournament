// Menú móvil, desplazamiento suave a las secciones y altura del hero.
export function iniciarMenu(): void {
  const boton = document.getElementById('mobileMenuButton');
  const menu = document.getElementById('mobileMenu');
  boton?.addEventListener('click', () => menu?.classList.toggle('hidden'));
  document.querySelectorAll('#mobileNav a').forEach((a) => a.addEventListener('click', () => menu?.classList.add('hidden')));

  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      const destino = document.querySelector(href);
      if (!destino) return;
      e.preventDefault();
      const y = destino.getBoundingClientRect().top + window.pageYOffset - 80; // alto de la cabecera fija
      window.scrollTo({ top: y, behavior: 'smooth' });
    });
  });

  const ajustar = () => {
    const hero = document.getElementById('inicio');
    if (hero) document.documentElement.style.setProperty('--hero-height', `${hero.offsetHeight}px`);
  };
  ajustar();
  window.addEventListener('resize', ajustar);
  window.addEventListener('load', ajustar);
}

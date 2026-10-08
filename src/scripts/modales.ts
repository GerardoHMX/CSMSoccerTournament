// Ventanas emergentes: detalle de noticia y ampliación de fotos de la galería.
import { traducir } from './i18n';

export function iniciarNoticias(): void {
  const fondo = document.getElementById('noticia-dialog-backdrop');
  const caja = document.getElementById('noticia-dialog-box');
  const cuerpo = document.getElementById('noticia-dialog-body');
  if (!fondo || !caja || !cuerpo) return;

  const abrir = (articulo: HTMLElement) => {
    const plantilla = articulo.querySelector<HTMLTemplateElement>('template[data-detalle]');
    if (!plantilla) return;
    cuerpo.replaceChildren(plantilla.content.cloneNode(true));
    Object.assign(fondo.style, { opacity: '1', pointerEvents: 'auto', zIndex: '9999' });
    Object.assign(caja.style, { opacity: '1', transform: 'translateY(0)', pointerEvents: 'auto', zIndex: '10000' });
  };
  const cerrar = () => {
    Object.assign(fondo.style, { opacity: '0', pointerEvents: 'none' });
    Object.assign(caja.style, { opacity: '0', transform: 'translateY(-56px)', pointerEvents: 'none' });
  };

  document.querySelectorAll<HTMLElement>('.noticia-card').forEach((a) => a.addEventListener('click', () => abrir(a)));
  caja.addEventListener('click', (e) => e.stopPropagation());
  fondo.addEventListener('click', (e) => { if (e.target === fondo) cerrar(); });
  fondo.querySelector('[data-cerrar]')?.addEventListener('click', (e) => { e.stopPropagation(); cerrar(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrar(); });
}

export function iniciarGaleria(): void {
  document.querySelectorAll<HTMLElement>('.galeria-item[data-ampliar]').forEach((item) => {
    item.addEventListener('click', () => {
      const img = item.querySelector<HTMLImageElement>('img[data-grande]');
      if (!img) return;
      const dialogo = document.createElement('dialog');
      dialogo.className = 'open:flex flex-col w-full max-w-4xl rounded-brand p-0';
      dialogo.innerHTML = `
        <div class="noticia-dialog-content">
          <div class="noticia-dialog-header">
            <h3 class="text-xl md:text-2xl font-bold"></h3>
            <button class="noticia-dialog-close" aria-label="Cerrar" type="button">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div class="noticia-dialog-body" style="overflow-y: auto;">
            <div class="p-4">
              <span class="text-xs sm:text-sm font-medium bg-gray-100 px-3 py-1 rounded-brand mb-4 inline-block"></span>
              <img class="w-full h-auto max-h-[70vh] object-contain rounded-brand mb-4" alt="" />
            </div>
          </div>
        </div>`;
      dialogo.querySelector('h3')!.textContent = item.dataset.titulo || traducir('section_gallery_title');
      dialogo.querySelector('span')!.textContent = item.dataset.etiquetaFecha ?? '';
      const grande = dialogo.querySelector('img')!;
      grande.src = img.currentSrc || img.src;
      grande.alt = item.dataset.titulo ?? '';
      dialogo.querySelector('button')!.addEventListener('click', () => dialogo.close());
      dialogo.addEventListener('click', (e) => { if (e.target === dialogo) dialogo.close(); });
      dialogo.addEventListener('close', () => dialogo.remove());
      document.body.appendChild(dialogo);
      dialogo.showModal();
    });
  });
}

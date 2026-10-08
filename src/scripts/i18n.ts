// Cambio de idioma ES/EN en el navegador (mismo mecanismo que el sitio original: atributos data-translate).
import es from '../i18n/es.json';
import en from '../i18n/en.json';
import { MESES, DIAS } from '../lib/fechas';

type Lang = 'es' | 'en';
const dic: Record<Lang, Record<string, string>> = { es, en };
export let idioma: Lang = 'es';

export function traducir(clave: string): string {
  return dic[idioma][clave] ?? dic.es[clave] ?? clave;
}

export function actualizarTextos(): void {
  document.querySelectorAll<HTMLElement>('[data-translate]').forEach((el) => {
    const clave = el.dataset.translate!;
    const txt = traducir(clave);
    if (txt && txt !== clave) el.textContent = txt;
  });
  document.querySelectorAll<HTMLElement>('[data-translate-placeholder]').forEach((el) => {
    (el as HTMLTextAreaElement).placeholder = traducir(el.dataset.translatePlaceholder!);
  });
  document.querySelectorAll<HTMLElement>('[data-translate-aria-label]').forEach((el) => {
    el.setAttribute('aria-label', traducir(el.dataset.translateAriaLabel!));
  });
  // Fechas con día de la semana y mes (data-date="d/m/yyyy")
  document.querySelectorAll<HTMLElement>('[data-date]').forEach((el) => {
    const [d, m, y] = el.dataset.date!.split('/').map(Number);
    const fecha = new Date(y, m - 1, d);
    const txt = `${DIAS[idioma][fecha.getDay()]} ${String(d).padStart(2, '0')} ${MESES[idioma][m - 1]}`;
    const nodo = Array.from(el.childNodes).reverse().find((n) => n.nodeType === Node.TEXT_NODE && n.textContent!.trim());
    if (nodo) nodo.textContent = ` ${txt}`;
    else el.append(` ${txt}`);
  });
  document.documentElement.lang = idioma;
}

export function cambiarIdioma(lang: Lang): void {
  idioma = lang;
  actualizarTextos();
  document.dispatchEvent(new CustomEvent('idioma-cambiado'));
}

export function iniciarIdioma(): void {
  const botones = document.querySelectorAll<HTMLElement>('[data-lang]');
  const marcar = (lang: Lang) => botones.forEach((b) => {
    const activo = b.dataset.lang === lang;
    b.classList.toggle('active', activo);
    b.classList.toggle('bg-brand-blue', activo);
    b.classList.toggle('text-white', activo);
    b.classList.toggle('text-gray-600', !activo);
  });
  botones.forEach((b) => b.addEventListener('click', (e) => {
    e.preventDefault();
    const lang: Lang = b.dataset.lang === 'en' ? 'en' : 'es';
    marcar(lang);
    cambiarIdioma(lang);
  }));
  // Idioma del navegador por defecto
  const inicial: Lang = (navigator.language || '').startsWith('en') ? 'en' : 'es';
  marcar(inicial);
  if (inicial !== 'es') cambiarIdioma(inicial);
}

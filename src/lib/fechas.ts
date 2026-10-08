export const MESES = {
  es: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};
export const DIAS = {
  es: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};

const p2 = (n: number) => String(n).padStart(2, '0');

/** "2026-02-09" (clave de día) a partir de una fecha, usando la hora local del servidor de build (las fechas del CMS no llevan hora). */
export function claveDia(d: Date): string {
  return `${d.getUTCFullYear()}-${p2(d.getUTCMonth() + 1)}-${p2(d.getUTCDate())}`;
}

/** 09/02/2026 */
export function ddmmyyyy(clave: string): string {
  const [y, m, d] = clave.split('-');
  return `${d}/${m}/${y}`;
}

/** "Lun 09 Febrero" en español (el navegador lo vuelve a formatear si el visitante cambia de idioma). */
export function etiquetaDia(clave: string, lang: 'es' | 'en' = 'es'): string {
  const [y, m, d] = clave.split('-').map(Number);
  const dia = new Date(y, m - 1, d);
  return `${DIAS[lang][dia.getDay()]} ${p2(d)} ${MESES[lang][m - 1]}`;
}

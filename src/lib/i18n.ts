import es from '../i18n/es.json';
/** Texto en español de una clave del diccionario (el navegador lo cambia a inglés con data-translate). */
export const t = (clave: string): string => (es as Record<string, string>)[clave] ?? clave;
export const claves = es as Record<string, string>;

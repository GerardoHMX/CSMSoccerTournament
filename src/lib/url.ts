/** Ruta de un archivo de /public respetando el "base" del despliegue (p. ej. /TorneoAl-Andalus/). */
export const url = (p: string) => `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${p.replace(/^\//, '')}`;

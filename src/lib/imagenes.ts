// Las imágenes subidas desde el CMS se guardan en src/assets y en los JSON como "/src/assets/…".
// Aquí las convertimos en "ImageMetadata" para que el componente <Image> de Astro las optimice.
import type { ImageMetadata } from 'astro';

const modulos = import.meta.glob<{ default: ImageMetadata }>('/src/assets/**/*.{png,jpg,jpeg,webp,avif,gif,svg}', { eager: true });

export function imagen(ruta?: string | null): ImageMetadata | undefined {
  if (!ruta) return undefined;
  const m = modulos[ruta];
  if (!m) throw new Error(`Imagen no encontrada: ${ruta}. ¿Se subió a la carpeta src/assets?`);
  return m.default;
}

import { defineConfig } from 'astro/config';

// SITE y BASE se pasan por variables de entorno en el despliegue (ver .github/workflows/deploy.yml).
// En local (npm run dev) se sirve desde la raíz.
export default defineConfig({
  output: 'static',
  site: process.env.SITE_URL || undefined,
  base: process.env.BASE_PATH || '/',
  trailingSlash: 'ignore',
  build: { assets: 'recursos' },
  image: { domains: [] },
});

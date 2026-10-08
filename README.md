# V Torneo Fútbol Sala Al-Ándalus — Colegio San Francisco de Asís

Web del torneo hecha con **Astro + Tailwind CSS 3**. Todo el contenido (equipos, resultados, noticias, galería, textos…)
vive en archivos JSON/Markdown dentro de `src/content/` y se edita desde **[Pages CMS](https://pagescms.org)**.
Cada cambio publica la web automáticamente en **GitHub Pages**. Coste: 0 €.

> Autor original: Gerardo Huizar Castro · Licencia CC BY-NC-SA 4.0

| Quién | Documento |
|---|---|
| Personas que actualizan la web (sin conocimientos técnicos) | **[GUIA-EDITORES.md](GUIA-EDITORES.md)** |
| Puesta en marcha y despliegue (pasos manuales) | **[Puesta en marcha](#puesta-en-marcha-pasos-manuales)** (este archivo) |
| Qué se hizo en la migración y por qué | [MIGRACION.md](MIGRACION.md) |

## Cómo funciona (resumen)

```
Pages CMS (formularios)  →  commit en GitHub  →  GitHub Actions: tests + astro build  →  GitHub Pages
```

* **No se capturan tablas de posiciones**: solo los resultados de los partidos. La tabla (PJ, PG, PE, PP, GF, GC, DG, Pts),
  los clasificados, los cruces de eliminatorias y el podio se **calculan en cada build** (`src/lib/torneo.ts`).
* Orden de la tabla: **Puntos → Diferencia de goles → Goles a favor → Enfrentamiento directo → Nombre**. Victoria 3 · empate 1 · derrota 0.
  El ajuste «El Fair Play suma a los puntos» (Pages CMS → *Datos del torneo y del colegio*) cambia el primer criterio a Puntos + Fair Play.
* Si un dato es inválido (p. ej. un empate en eliminatoria sin penales, o un equipo que no existe) **el build falla con un mensaje en español**
  y la web anterior sigue publicada: nunca se publica una web rota.

## Estructura

```
.pages.yml                 Formularios de Pages CMS
.github/workflows/         Publicación automática (GitHub Pages)
src/content/               DATOS editables (JSON / Markdown)     ← lo que toca el CMS
src/assets/                Imágenes subidas desde el CMS (se optimizan al compilar)
src/components/            Una pieza de la web cada uno (Header, Jornadas, Bracket…)
src/pages/index.astro      La página única
src/lib/                   Lógica: torneo.ts (tabla, cruces, podio), datos.ts, fechas…
src/scripts/               JavaScript del navegador (filtros, idioma, carrusel, modales…)
src/i18n/                  Textos de la interfaz en español e inglés
public/                    Fuentes LaLiga e imágenes fijas
tests/                     Pruebas de la lógica
scripts/                   Scripts de UN SOLO USO de la migración (se pueden borrar)
```

## Desarrollo local

```bash
npm install
npm run dev        # http://localhost:4321 con recarga automática
npm test           # pruebas de la lógica
npm run build      # genera la carpeta dist/
```

Requiere Node.js 20.3+ (en GitHub Actions se usa Node 22).

## Puesta en marcha (pasos manuales)

1. **Crear el repositorio nuevo** en GitHub (público; GitHub Pages gratis lo exige). Súbele el contenido de esta carpeta
   **sin** `legacy/`, `scripts/data/` ni `node_modules/` (el `.gitignore` ya los excluye):
   ```bash
   git init && git add . && git commit -m "Migración a Astro"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/NOMBRE-DEL-REPO.git
   git push -u origin main
   ```
2. En GitHub: **Settings → Pages → Build and deployment → Source: «GitHub Actions»**.
3. Pestaña **Actions**: espera a que «Publicar web» termine en verde (~2 min). La web queda en
   `https://TU-USUARIO.github.io/NOMBRE-DEL-REPO/`. (Si el repo se llama `TU-USUARIO.github.io` se sirve en la raíz.)
4. **Pages CMS**: entra en <https://app.pagescms.org> con tu cuenta de GitHub, instala/autoriza la app sobre el repositorio y ábrelo.
   Verás los formularios definidos en `.pages.yml`.
5. **Invitar a la otra persona**: *Settings → Collaborators → Add people* con permiso **Write**. Esa persona necesita una cuenta de GitHub
   (gratuita) y entra en Pages CMS con ella. Para que solo vea Pages CMS no necesita saber nada de GitHub.
6. Comprueba los ajustes que dependen de la dirección nueva: **ID de Google Analytics** (Datos del torneo) y la **URL del Apps Script**
   del widget de valoraciones (se mantiene la hoja FEEDBACK de Google).
7. *(Opcional)* Dominio propio: Settings → Pages → Custom domain. Tras ello define la variable `BASE_PATH=/` o usa un repo `usuario.github.io`.
8. Cuando todo esté validado, borra de tu copia local `legacy/` y `scripts/` (copias de la migración).

### Alternativa: Cloudflare Pages (gratis)

Cloudflare Pages → *Create project → Connect to Git* → framework **Astro**, comando `npm run build`, carpeta `dist`,
variable `NODE_VERSION=22`. No hace falta cambiar nada del código; si no hay subcarpeta, no definas `BASE_PATH`.

## Límite de tamaño

El repositorio pesa unos 10 MB. GitHub recomienda no pasar de ~1 GB y no admite archivos de más de 100 MB:
**los vídeos no se suben**, se enlazan (YouTube o Drive). Sube fotos de ≤ 2 MB (Pages CMS no las redimensiona).

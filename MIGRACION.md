# Migración a Astro + Tailwind + Pages CMS — informe final

Estado: **fase 2 completada** (la web compila, las pruebas pasan, se comparó visualmente con https://gerardohmx.github.io/TorneoAl-Andalus en escritorio y móvil).
Pasos manuales que te tocan: ver [README.md → Puesta en marcha](README.md#puesta-en-marcha-pasos-manuales).

## Decisiones tomadas

| Tema | Decisión |
|---|---|
| Datos de origen | **Hoja publicada de Google Sheets** (CSV) — era más reciente que el xlsx (el torneo ya tenía final y podio). El script acepta CSV (`scripts/data/csv/`) o el xlsx |
| Tabla de posiciones | Calculada en el build. 3-1-0, solo partidos con goles. Orden: **Pts → DG → GF → enfrentamiento directo → nombre** |
| Fair Play | Número manual por equipo (valores tomados de la hoja). **No suma a los puntos** por defecto (ajuste en el CMS) — ver hallazgo 2 |
| Eliminatorias | El build rellena los equipos (1.ºA–2.ºB, 1.ºB–2.ºA, 1.ºC–2.ºD, 1.ºD–2.ºC → semifinales → 3.er puesto y final ESO vs BCH). Cada cruce se verificó contra el torneo real |
| Tailwind | 3.4.17 con tu configuración original (sin saltar a v4) |
| Bootstrap | Se mantiene (CSS + collapse por npm). El modal de noticias/galería ya era propio, se conservó |
| Nombres de jugadores | La web siempre los abrevia («LUCAS L.»); el repo solo guarda las iniciales |
| Hosting | GitHub Pages + GitHub Actions (alternativa Cloudflare Pages documentada) |
| Imágenes | 38 de Drive → `src/assets/` (8,5 MB). Astro las convierte a WebP y crea varios tamaños al compilar. **Nunca se acercará a 500 MB** salvo que se suban vídeos |

## Hallazgos que conviene que conozcas

1. **El xlsx estaba desactualizado** respecto a la hoja publicada (faltaban semifinales, final, podio y la visibilidad de secciones). Se usó la hoja publicada.
2. **FairPlay**: la hoja decidía los clasificados con `Puntos + FairPlay`, pero la web ordenaba solo por puntos. Con la fórmula de la hoja, del grupo A
   habría pasado *Los trece Larrys* en vez de *La Bubineta* (que fue quien jugó los cuartos). Por eso el valor por defecto es «no suma».
3. **Error en la hoja**: la celda de *goles a favor de La Bubineta* está escrita a mano (13) en lugar de calculada; sus partidos suman 14.
   La web nueva muestra el valor correcto (GF 14, DG +11).
4. **Fallo de la web antigua** que ahora se corrige: la semifinal de ESO (un solo partido) no se mostraba en «Jornadas» porque el código exigía 2 tarjetas.
5. «Equipos» mostraba `Curso: ESO` (mostraba el ciclo); ahora muestra el curso real (`Curso: 3º ESO A`).
6. La tarjeta 1 y 2 de las Bases mostraban el logo del colegio (por un valor de reserva); ahora usan el logo del torneo y el cartel (los que el código original traía como predeterminados). Se cambian desde el CMS.
7. Una foto de la galería («Partidos», no publicada) no es pública en Drive y no se migró.
8. Se eliminan: precarga animada (ya no hay carga de datos), recarga automática cada 5 min y la dependencia `@material-tailwind` por unpkg.

## Datos migrados (resumen)

16 equipos · 32 partidos · 56 goleadores · 15 sancionados · 4 noticias · 4 elementos de galería · 25 secciones · 9 tarjetas de Bases · 6 imágenes del podio de goleadores.

## Conceptos de Astro usados (para tu primera vez)

| Concepto | Dónde |
|---|---|
| **Página `.astro`**: la parte entre `---` se ejecuta *solo al compilar*; debajo va HTML normal | `src/pages/index.astro` |
| **Componentes**: trozos de HTML reutilizables con parámetros (`props`) | `src/components/*.astro` (salen de las plantillas de tu antiguo `ui.js`) |
| **Layout**: la carcasa con `<head>`, estilos y `<slot />` donde entra la página | `src/layouts/Base.astro` |
| **Content Collections**: carpetas de JSON/Markdown con un esquema (Zod) que se valida al compilar | `src/content.config.ts` + `src/content/` |
| **`<Image>` de `astro:assets`**: redimensiona y convierte imágenes al compilar | `Logo.astro`, `Noticias.astro`… |
| **Cero JS por defecto**: solo viaja el que escribes en un `<script>` | `src/scripts/` |
| **Salida estática**: `npm run build` produce `dist/` (HTML/CSS/JS planos) que se sube a Pages | `.github/workflows/deploy.yml` |

## Scripts de un solo uso (puedes borrarlos al terminar)

* `scripts/descargar-imagenes.mjs` — descarga las imágenes de Drive (miniaturas de 1600 px) a `scripts/.cache/`.
* `scripts/convertir-xlsx.mjs` — convierte CSV/xlsx → `src/content/**` y copia las imágenes a `src/assets/**` (idempotente; **borra y regenera `src/content` y `src/assets`**, así que no lo ejecutes después de empezar a editar desde el CMS).
* `scripts/extraer-traducciones.mjs` — extrajo `translations.js` a `src/i18n/{es,en}.json`.
* `npm run test:migracion` — compara el cálculo con las fórmulas de la hoja (solo tiene sentido antes de editar datos).

## Pendiente / a revisar por ti

* Revisión final de ojo con tus datos (el diseño se comparó, no se midió píxel a píxel).
* La referencia a equipos de Pages CMS guarda `{name}`; el código acepta el nombre con o sin `.json` o con ruta, pero **prueba el primer guardado de un partido** y comprueba que el build pasa.
* Pages CMS no oculta campos según otros (p. ej. penales solo en eliminatorias): se resuelve con textos de ayuda y con la validación del build.
* Las fuentes LaLiga siguen en `public/fonts` (tal cual en el original).

// SCRIPT DE UN SOLO USO: convierte scripts/data/torneo.xlsx → src/content/** (JSON/Markdown)
// y copia las imágenes (descargadas con descargar-imagenes.mjs) a src/assets/** con nombres legibles.
// Es idempotente: puede ejecutarse varias veces. Imprime un informe de incidencias al final.
import fs from 'node:fs';
import path from 'node:path';
import { abrirLibro, valor, idDrive, slug, aFecha } from './_xlsx.mjs';

const CACHE = 'scripts/.cache/imagenes';
const C = 'src/content';
const A = 'src/assets';
const informe = [];
const aviso = (m) => informe.push(m);

const escribir = (ruta, datos) => {
  fs.mkdirSync(path.dirname(ruta), { recursive: true });
  fs.writeFileSync(ruta, typeof datos === 'string' ? datos : JSON.stringify(datos, null, 2) + '\n');
};
const limpiar = (d) => fs.rmSync(d, { recursive: true, force: true });

// ---------- imágenes ----------
const usadas = new Map(); // id → ruta destino (/src/assets/...)
function imagen(url, carpeta, nombre) {
  const id = idDrive(url);
  if (!id) return url ? (aviso(`URL de imagen no reconocida: ${url}`), null) : null;
  const f = fs.existsSync(CACHE) && fs.readdirSync(CACHE).find((x) => x.startsWith(id + '.'));
  if (!f) { aviso(`Imagen no descargada (¿no es pública?): ${id} → ${carpeta}/${nombre}`); return null; }
  if (usadas.has(id)) return usadas.get(id);
  const ext = path.extname(f);
  const dest = `${A}/${carpeta}/${nombre}${ext}`;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(path.join(CACHE, f), dest);
  usadas.set(id, '/' + dest);
  return '/' + dest;
}

const wb = await abrirLibro();

const hoja = (n) => wb.getWorksheet(n);
const celda = (ws, r, c) => valor(ws.getRow(r).getCell(c));
const texto = (v) => (v == null ? null : String(v).replace(/^"+|"+$/g, '').trim() || null);
const num = (v) => (v == null || v === '' || Number.isNaN(Number(v)) ? null : Number(v));

function hhmm(v) {
  if (v == null) return null;
  if (v instanceof Date) return `${String(v.getUTCHours()).padStart(2, '0')}:${String(v.getUTCMinutes()).padStart(2, '0')}`;
  const m = String(v).match(/(\d{1,2})[:.](\d{2})/);
  return m ? `${m[1].padStart(2, '0')}:${m[2]}` : null;
}

for (const d of [`${C}/equipos`, `${C}/partidos`, `${C}/noticias`, `${C}/galeria`, A]) limpiar(d);
// Imagen del cartel del torneo (usada en las Bases)
imagen('https://drive.google.com/file/d/1wUqSjzfL4POj_t5pC0_RDkLlsgbyDqXT/view', 'sitio', 'cartel-torneo');


// ---------- EQUIPOS (hoja EQUIPOS + FairPlay de CLASIFICACION) ----------
const clasif = hoja('CLASIFICACION');
const fairplay = new Map(); // nombre equipo → fairplay
for (let r = 4; r <= clasif.rowCount; r++) {
  const nombre = texto(celda(clasif, r, 21)); // U
  const fp = num(celda(clasif, r, 29)); // AC
  if (nombre && nombre !== 'EQUIPOS' && fp != null) fairplay.set(nombre, fp);
}
const datos = hoja('DATOS');
const logoDatos = new Map();
if (datos) for (let r = 4; r <= 19; r++) logoDatos.set(texto(celda(datos, r, 4)), celda(datos, r, 3));

const equipos = []; // {id,nombre,ciclo,curso,grupo}
const eq = hoja('EQUIPOS');
for (let r = 4; r <= eq.rowCount; r++) {
  const grupo = texto(celda(eq, r, 1));
  const nombre = texto(celda(eq, r, 5));
  if (!nombre || grupo === 'GRUPO') continue;
  const id = slug(nombre);
  const logo = imagen(celda(eq, r, 4) ?? logoDatos.get(nombre), 'equipos', id);
  const e = {
    nombre,
    ciclo: texto(celda(eq, r, 2)),
    curso: texto(celda(eq, r, 3)),
    grupo,
    logo,
    fairplay: fairplay.get(nombre) ?? 0,
    orden: equipos.filter((x) => x.grupo === grupo).length + 1,
  };
  if (!fairplay.has(nombre)) aviso(`Equipo sin FairPlay en la hoja: ${nombre} (se pone 0)`);
  equipos.push({ id, ...e });
  escribir(`${C}/equipos/${id}.json`, e);
}
const porNombre = new Map(equipos.map((e) => [e.nombre, e.id]));
const porCurso = new Map(equipos.map((e) => [e.curso, e.id]));

// ---------- PARTIDOS ----------
const FASES = { CUARTOS: 'cuartos', SEMIFINAL: 'semifinal', '3RPUESTO': 'tercer_puesto', '1RPUESTO': 'final' };
let nPartidos = 0;
for (let r = 4; r <= clasif.rowCount; r++) {
  const grupoRaw = texto(celda(clasif, r, 1));
  const numero = num(celda(clasif, r, 4));
  if (!grupoRaw || grupoRaw === 'GRUPO' || numero == null) continue;
  const fase = FASES[grupoRaw] ?? 'grupos';
  const anio = num(celda(clasif, r, 5)), mes = num(celda(clasif, r, 6)), dia = num(celda(clasif, r, 7));
  const fecha = anio && mes && dia ? `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}` : null;
  if (!fecha) aviso(`Partido ${numero}: sin fecha completa (año ${anio}, mes ${mes}, día ${dia})`);
  const estado = texto(celda(clasif, r, 18));
  const gl = num(celda(clasif, r, 12)), gv = num(celda(clasif, r, 14));
  const jugado = estado === 'JUGADO';
  const p = { numero, fase };
  if (fase === 'grupos') p.grupo = grupoRaw;
  if (fecha) p.fecha = fecha;
  const hora = hhmm(celda(clasif, r, 8));
  if (hora) p.hora = hora;
  if (fase === 'grupos') {
    // En fase de grupos los equipos se capturan; en eliminatorias los rellena el build.
    const l = porNombre.get(texto(celda(clasif, r, 10))), v = porNombre.get(texto(celda(clasif, r, 17)));
    if (!l || !v) aviso(`Partido ${numero}: equipo no encontrado`);
    p.local = l; p.visitante = v;
  }
  if (jugado) {
    p.goles_local = gl; p.goles_visitante = gv;
    if (fase !== 'grupos') {
      const pl = num(celda(clasif, r, 22)), pv = num(celda(clasif, r, 23));
      if (pl || pv) { p.penales_local = pl ?? 0; p.penales_visitante = pv ?? 0; }
    }
  } else if (gl || gv) aviso(`Partido ${numero}: tiene goles pero no está JUGADO; se ignoran`);
  escribir(`${C}/partidos/${String(numero).padStart(3, '0')}.json`, p);
  nPartidos++;
}

// ---------- GOLEADORES ----------
const iniciales = (nombre) => {
  const partes = nombre.trim().split(/\s+/);
  const primero = partes[0].toUpperCase();
  const resto = partes.slice(1).map((p) => p[0].toUpperCase() + '.').join('');
  return resto ? `${primero} ${resto}` : primero;
};
const lid = hoja('LIDERES');
const goleadores = [];
for (let r = 4; r <= lid.rowCount; r++) {
  const curso = texto(celda(lid, r, 4)), nombre = texto(celda(lid, r, 5)), goles = num(celda(lid, r, 6));
  if (!nombre || !curso) continue;
  const equipo = porCurso.get(curso);
  if (!equipo) { aviso(`Goleador ${nombre}: curso sin equipo (${curso})`); continue; }
  goleadores.push({ equipo, jugador: iniciales(nombre), goles: goles ?? 0 });
}
escribir(`${C}/goleadores.json`, { jugadores: goleadores });

// ---------- SANCIONES ----------
const san = hoja('SANCIONES');
const sanciones = [];
for (let r = 4; r <= san.rowCount; r++) {
  const curso = texto(celda(san, r, 4)), nombre = texto(celda(san, r, 5));
  if (!nombre || !curso) continue;
  const equipo = porCurso.get(curso);
  if (!equipo) { aviso(`Sancionado ${nombre}: curso sin equipo (${curso})`); continue; }
  sanciones.push({ equipo, jugador: iniciales(nombre), rojas: num(celda(san, r, 6)) ?? 0,
    amarillas: num(celda(san, r, 7)) ?? 0, suspendidos: num(celda(san, r, 8)) ?? 0 });
}
escribir(`${C}/sanciones.json`, { jugadores: sanciones });

// ---------- AVATARES (OTROS, bloque izquierdo) ----------
const otros = hoja('OTROS');
const avatares = [];
for (let r = 4; r <= otros.rowCount; r++) {
  const ciclo = texto(celda(otros, r, 1)), pos = num(celda(otros, r, 2));
  if (!ciclo || pos == null) continue;
  const img = imagen(celda(otros, r, 3), 'lideres', `${ciclo.toLowerCase()}-${pos}`);
  if (img) avatares.push({ ciclo, posicion: pos, imagen: img });
}
escribir(`${C}/avatares.json`, { avatares });

// ---------- SECCIONES (OTROS, bloque derecho) ----------
const secciones = [];
for (let r = 4; r <= otros.rowCount; r++) {
  const id = texto(celda(otros, r, 5));
  if (!id) continue;
  secciones.push({ id, nombre: texto(celda(otros, r, 6)) ?? id,
    en_menu: texto(celda(otros, r, 7)) === 'SI', visible: texto(celda(otros, r, 8)) === 'SI' });
}
escribir(`${C}/secciones.json`, { secciones });

// ---------- CONFIGURACION ----------
const cfg = hoja('CONFIGURACION');
const k = {};
for (let r = 4; r <= cfg.rowCount; r++) { const c = texto(celda(cfg, r, 1)); if (c) k[c] = celda(cfg, r, 2); }
const sitio = {
  torneo_nombre: k.TORNEO_NOMBRE, torneo_anio: k.TORNEO_ANIO, torneo_descripcion: k.TORNEO_DESCRIPCION,
  torneo_logo: imagen(k.TORNEO_LOGO_URL, 'sitio', 'logo-torneo'),
  colegio_nombre: k.COLEGIO_NOMBRE, colegio_telefono1: k.COLEGIO_TELEFONO1, colegio_telefono2: k.COLEGIO_TELEFONO2,
  colegio_email: k.COLEGIO_EMAIL, colegio_direccion: k.COLEGIO_DIRECCION, colegio_localidad: k.COLEGIO_LOCALIDAD,
  colegio_provincia: k.COLEGIO_PROVINCIA, colegio_maps_url: k.COLEGIO_MAPS_URL, colegio_url: k.COLEGIO_URL,
  colegio_logo: imagen(k.COLEGIO_LOGO_URL, 'sitio', 'logo-colegio'),
  instagram_url: k.REDES_INSTAGRAM_URL, ga_tracking_id: k.GA_TRACKING_ID, feedback_script_url: k.FEEDBACK_SCRIPT_URL,
  // false = ordena por puntos y luego diferencia de goles (como la web actual y como se jugaron las eliminatorias reales).
  // true = suma el FairPlay a los puntos (como la fórmula "TOTAL" de la hoja).
  fairplay_suma_puntos: false,
};
escribir(`${C}/sitio.json`, sitio);

// ---------- NOTICIAS ----------
const noti = hoja('NOTICIAS');
let nNoticias = 0;
for (let r = 4; r <= noti.rowCount; r++) {
  const titulo = texto(celda(noti, r, 5)), cuerpo = texto(celda(noti, r, 7));
  const fecha = aFecha(celda(noti, r, 1));
  if (!titulo || !cuerpo || !fecha) continue;
  const f = fecha.toISOString().slice(0, 10);
  const base = `${f}-${slug(titulo).slice(0, 50)}`;
  const imgs = [8, 9, 10, 11, 12].map((c, i) => imagen(celda(noti, r, c), 'noticias', `${base}-${i + 1}`)).filter(Boolean);
  const fm = [`---`, `titulo: ${JSON.stringify(titulo)}`, `fecha: ${f}`, `autor: ${JSON.stringify(texto(celda(noti, r, 2)) ?? '')}`,
    `publicar: ${texto(celda(noti, r, 3)) === 'SI'}`, `imagenes:`, ...imgs.map((i) => `  - ${i}`), `---`].join('\n');
  escribir(`${C}/noticias/${base}.md`, `${fm}\n\n${cuerpo.replace(/\r\n/g, '\n')}\n`);
  nNoticias++;
}

// ---------- GALERIA ----------
const gal = hoja('GALERIA');
let nGal = 0;
for (let r = 4; r <= gal.rowCount; r++) {
  const fecha = aFecha(celda(gal, r, 1)), tipo = texto(celda(gal, r, 2)), url = celda(gal, r, 4);
  if (!fecha || !url) continue;
  const f = fecha.toISOString().slice(0, 10);
  const titulo = texto(celda(gal, r, 5));
  const id = `${f}-${String(r).padStart(2, '0')}-${slug(titulo ?? tipo ?? 'item').slice(0, 30)}`;
  const item = { fecha: f, tipo: tipo === 'VIDEO' ? 'video' : 'imagen', publicar: texto(celda(gal, r, 3)) === 'SI' };
  if (titulo) item.titulo = titulo;
  if (item.tipo === 'video') {
    item.video_url = typeof url === 'string' ? url : String(url);
    item.imagen = imagen(url, 'galeria', id); // miniatura (fotograma)
  } else {
    item.imagen = imagen(url, 'galeria', id);
    if (!item.imagen) { aviso(`Galería ${id}: imagen no disponible${item.publicar ? '' : ' (no publicada)'}; se omite`); continue; }
  }
  escribir(`${C}/galeria/${id}.json`, item);
  nGal++;
}

// ---------- Resumen ----------
console.log(`Equipos ${equipos.length} · Partidos ${nPartidos} · Goleadores ${goleadores.length} · Sancionados ${sanciones.length}`);
console.log(`Secciones ${secciones.length} · Avatares ${avatares.length} · Noticias ${nNoticias} · Galería ${nGal} · Imágenes ${usadas.size}`);
console.log(informe.length ? '\nINCIDENCIAS:\n- ' + informe.join('\n- ') : '\nSin incidencias.');

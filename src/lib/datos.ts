// Carga todos los contenidos y calcula lo derivado (tablas, cruces, podio). Se ejecuta en el build.
import { getCollection, getEntry } from 'astro:content';
import { marked } from 'marked';
import { calcularTorneo, abreviarNombre, tablaCiclo, type Equipo, type Partido, type Ciclo } from './torneo';
import { claveDia } from './fechas';

export async function cargarDatos() {
  const [sitioE, seccionesE, basesE, golE, sanE, avaE] = await Promise.all([
    getEntry('sitio', 'sitio'), getEntry('secciones', 'secciones'), getEntry('bases', 'bases'),
    getEntry('goleadores', 'goleadores'), getEntry('sanciones', 'sanciones'), getEntry('avatares', 'avatares'),
  ]);
  if (!sitioE || !seccionesE || !basesE || !golE || !sanE || !avaE) throw new Error('Faltan archivos de contenido en src/content');
  const sitio = sitioE.data;

  const equipos: Equipo[] = (await getCollection('equipos'))
    .map((e) => ({ id: e.id, ...e.data, logo: e.data.logo ?? null }))
    .sort((a, b) => a.grupo.localeCompare(b.grupo) || (a as any).orden - (b as any).orden || a.nombre.localeCompare(b.nombre, 'es'));
  const porId = new Map(equipos.map((e) => [e.id, e]));

  const partidos: Partido[] = (await getCollection('partidos')).map((p) => ({
    ...p.data,
    fecha: p.data.fecha ? claveDia(p.data.fecha) : undefined,
    local: p.data.local, visitante: p.data.visitante,
  }));
  const sinEquipo = (id: string | undefined, donde: string) => { if (id && !porId.has(id)) throw new Error(`${donde}: el equipo "${id}" no existe en la carpeta de equipos`); };
  partidos.forEach((p) => { sinEquipo(p.local, `Partido ${p.numero}`); sinEquipo(p.visitante, `Partido ${p.numero}`); });
  [...golE.data.jugadores, ...sanE.data.jugadores].forEach((j) => sinEquipo(j.equipo, `Jugador ${j.jugador}`));
  const numeros = partidos.map((p) => p.numero);
  const repetidos = numeros.filter((n, i) => numeros.indexOf(n) !== i);
  if (repetidos.length) throw new Error(`Números de partido repetidos: ${repetidos.join(', ')}`);

  const opciones = { fairplaySumaPuntos: sitio.fairplay_suma_puntos };
  const torneo = calcularTorneo(equipos, partidos, opciones);
  const clasificacion = { ESO: tablaCiclo(torneo, 'ESO', opciones), BCH: tablaCiclo(torneo, 'BCH', opciones) };

  const secciones = seccionesE.data.secciones;
  const visible = (id: string) => secciones.find((s) => s.id === id)?.visible ?? true;

  const bases = basesE.data.tarjetas.filter((t) => t.activa).map((t) => ({ ...t, html: marked.parse(t.contenido, { async: false }) as string }));

  const jugadorGol = golE.data.jugadores.map((j) => {
    const e = porId.get(j.equipo)!;
    return { ciclo: e.ciclo, equipo: e.nombre, curso: e.curso, jugador: abreviarNombre(j.jugador), goles: j.goles };
  }).sort((a, b) => b.goles - a.goles);

  const sancionados = sanE.data.jugadores.map((j) => {
    const e = porId.get(j.equipo)!;
    return { ciclo: e.ciclo, equipo: e.nombre, curso: e.curso, jugador: abreviarNombre(j.jugador), rojas: j.rojas, amarillas: j.amarillas, suspendidos: j.suspendidos };
  });

  const noticias = (await getCollection('noticias'))
    .filter((n) => n.data.publicar)
    .map((n) => {
      const html = marked.parse(n.body ?? '', { async: false }) as string;
      const plano = (n.body ?? '').replace(/[*_#>`]/g, '').replace(/\s*\n\s*/g, ' ').trim();
      return { id: n.id, ...n.data, fecha: claveDia(n.data.fecha), html, plano };
    })
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  const galeria = (await getCollection('galeria'))
    .filter((g) => g.data.publicar)
    .map((g) => ({ id: g.id, ...g.data, fecha: claveDia(g.data.fecha) }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  const ciclos: Ciclo[] = ['ESO', 'BCH'];
  return {
    sitio, secciones, visible, equipos, porId, torneo, clasificacion, bases,
    jugadorGol, sancionados, avatares: avaE.data.avatares, noticias, galeria, ciclos,
  };
}
export type Datos = Awaited<ReturnType<typeof cargarDatos>>;

// Lógica del torneo (pura, sin Astro): tabla de posiciones, clasificados, cruces y podio.
// Se ejecuta SOLO durante el build. Reproduce las reglas del xlsx original:
//  · 3 puntos victoria · 1 empate · 0 derrota · solo cuentan los partidos jugados
//  · PJ = PG+PE+PP · GF/GC = goles a favor/en contra · DG = GF−GC
//  · pasan los 2 primeros de cada grupo cuando el grupo ha terminado

export type Fase = 'grupos' | 'cuartos' | 'semifinal' | 'tercer_puesto' | 'final';
export type Ciclo = 'ESO' | 'BCH';

export interface Equipo {
  id: string;
  nombre: string;
  ciclo: Ciclo;
  curso: string;
  grupo: string;
  logo?: string | null;
  fairplay: number;
}

export interface Partido {
  numero: number;
  fase: Fase;
  grupo?: string;
  fecha?: string;
  hora?: string;
  local?: string;
  visitante?: string;
  goles_local?: number | null;
  goles_visitante?: number | null;
  penales_local?: number | null;
  penales_visitante?: number | null;
  estado?: 'programado' | 'jugado' | 'cancelado';
}

export interface PartidoResuelto extends Partido {
  local?: string;
  visitante?: string;
  jugado: boolean;
  ciclo?: Ciclo;
  ganador?: string | null;
  perdedor?: string | null;
  /** 'G' | 'E' | 'P' desde el punto de vista del local (solo si jugado) */
  resultadoLocal?: 'G' | 'E' | 'P';
}

export interface Opciones {
  /** true = suma el FairPlay a los puntos al ordenar (fórmula TOTAL de la hoja). */
  fairplaySumaPuntos?: boolean;
}

export interface FilaTabla {
  equipo: Equipo;
  PJ: number; PG: number; PE: number; PP: number;
  GF: number; GC: number; DG: number; Pts: number;
  FairPlay: number; Total: number;
  posicion: number;
}

export const PUNTOS = { victoria: 3, empate: 1, derrota: 0 } as const;

export const esJugado = (p: Partido): boolean =>
  typeof p.goles_local === 'number' &&
  typeof p.goles_visitante === 'number' &&
  p.estado !== 'cancelado' &&
  p.estado !== 'programado';

/** Ganador de un partido jugado: por goles y, si hay empate, por penales. */
function ganadorLocal(p: Partido): boolean | null {
  const gl = p.goles_local ?? 0, gv = p.goles_visitante ?? 0;
  if (gl !== gv) return gl > gv;
  const pl = p.penales_local ?? 0, pv = p.penales_visitante ?? 0;
  if (pl !== pv) return pl > pv;
  return null; // empate sin resolver
}

// ------------------------------------------------------------------ tabla de grupo
const vacia = (equipo: Equipo): FilaTabla => ({
  equipo, PJ: 0, PG: 0, PE: 0, PP: 0, GF: 0, GC: 0, DG: 0, Pts: 0,
  FairPlay: equipo.fairplay ?? 0, Total: 0, posicion: 0,
});

/** Estadísticas (sin ordenar) de un conjunto de equipos con los partidos jugados dados. */
function acumular(equipos: Equipo[], partidos: Pick<Partido, 'local' | 'visitante' | 'goles_local' | 'goles_visitante'>[]) {
  const filas = new Map(equipos.map((e) => [e.id, vacia(e)]));
  for (const p of partidos) {
    const l = filas.get(p.local!), v = filas.get(p.visitante!);
    if (!l || !v) continue;
    const gl = p.goles_local!, gv = p.goles_visitante!;
    l.GF += gl; l.GC += gv; v.GF += gv; v.GC += gl;
    if (gl > gv) { l.PG++; v.PP++; l.Pts += PUNTOS.victoria; v.Pts += PUNTOS.derrota; }
    else if (gl < gv) { v.PG++; l.PP++; v.Pts += PUNTOS.victoria; l.Pts += PUNTOS.derrota; }
    else { l.PE++; v.PE++; l.Pts += PUNTOS.empate; v.Pts += PUNTOS.empate; }
  }
  for (const f of filas.values()) {
    f.PJ = f.PG + f.PE + f.PP;
    f.DG = f.GF - f.GC;
    f.Total = f.Pts + f.FairPlay;
  }
  return [...filas.values()];
}

/**
 * Tabla de posiciones de un grupo.
 * Orden: Pts (o Pts+FairPlay si se activa) → DG → GF → enfrentamiento directo (empates a 2) → nombre.
 */
export function tablaGrupo(equipos: Equipo[], partidos: Partido[], op: Opciones = {}): FilaTabla[] {
  const jugados = partidos.filter(esJugado);
  const filas = acumular(equipos, jugados);
  const clave = (f: FilaTabla) => (op.fairplaySumaPuntos ? f.Total : f.Pts);
  const directo = (a: FilaTabla, b: FilaTabla) => {
    const mutuos = jugados.filter(
      (p) => (p.local === a.equipo.id && p.visitante === b.equipo.id) || (p.local === b.equipo.id && p.visitante === a.equipo.id));
    if (!mutuos.length) return 0;
    const t = acumular([a.equipo, b.equipo], mutuos);
    return t[1].Pts - t[0].Pts; // >0 si b mejor
  };
  filas.sort((a, b) =>
    clave(b) - clave(a) || b.DG - a.DG || b.GF - a.GF ||
    // el enfrentamiento directo solo es fiable entre dos equipos igualados
    (empatados(filas, a, b, clave) === 2 ? directo(a, b) : 0) ||
    a.equipo.nombre.localeCompare(b.equipo.nombre, 'es'));
  filas.forEach((f, i) => (f.posicion = i + 1));
  return filas;
}

function empatados(filas: FilaTabla[], a: FilaTabla, b: FilaTabla, clave: (f: FilaTabla) => number) {
  return filas.filter((f) => clave(f) === clave(a) && f.DG === a.DG && f.GF === a.GF).length;
}

/** Un grupo está terminado cuando todos sus partidos (todos contra todos) se han jugado. */
export function grupoTerminado(equipos: Equipo[], partidos: Partido[]): boolean {
  const esperados = (equipos.length * (equipos.length - 1)) / 2;
  return partidos.length >= esperados && partidos.every(esJugado);
}

// ------------------------------------------------------------------ cruces
/** Origen de cada equipo en las eliminatorias (por número de partido). 1A = primero del grupo A; G25 = ganador del 25; P29 = perdedor del 29. */
export const CRUCES: Record<number, [string, string]> = {
  25: ['1A', '2B'], 26: ['1B', '2A'], // ESO · cuartos
  27: ['1C', '2D'], 28: ['1D', '2C'], // BCH · cuartos
  29: ['G25', 'G26'], 30: ['G27', 'G28'], // semifinales
  31: ['P29', 'P30'], // tercer puesto (mejor ESO vs mejor BCH)
  32: ['G29', 'G30'], // final
};

/** Ciclo de cada partido de eliminatoria (los de 3.er puesto y final enfrentan ESO contra BCH y no tienen ciclo). */
export const CICLO_CRUCE: Record<number, Ciclo> = { 25: 'ESO', 26: 'ESO', 29: 'ESO', 27: 'BCH', 28: 'BCH', 30: 'BCH' };

export interface Torneo {
  equipos: Equipo[];
  partidos: PartidoResuelto[];
  grupos: Record<string, { tabla: FilaTabla[]; terminado: boolean }>;
  clasificados: Record<string, string | undefined>; // '1A' → id
  podio: { campeon?: string; subcampeon?: string; tercero?: string };
}

/** Calcula todo: tablas, clasificados, equipos de cada cruce, ganadores y podio. */
export function calcularTorneo(equipos: Equipo[], partidos: Partido[], op: Opciones = {}): Torneo {
  const grupoIds = [...new Set(equipos.map((e) => e.grupo))].sort();
  const grupos: Torneo['grupos'] = {};
  const clasificados: Torneo['clasificados'] = {};
  for (const g of grupoIds) {
    const eq = equipos.filter((e) => e.grupo === g);
    const pg = partidos.filter((p) => p.fase === 'grupos' && p.grupo === g);
    const tabla = tablaGrupo(eq, pg, op);
    const terminado = grupoTerminado(eq, pg);
    grupos[g] = { tabla, terminado };
    if (terminado) { clasificados[`1${g}`] = tabla[0]?.equipo.id; clasificados[`2${g}`] = tabla[1]?.equipo.id; }
  }
  const porId = new Map(equipos.map((e) => [e.id, e]));
  const ordenados = [...partidos].sort((a, b) => a.numero - b.numero);
  const res = new Map<number, PartidoResuelto>();
  const origen = (ref: string): string | undefined => {
    if (/^[12][A-Z]$/.test(ref)) return clasificados[ref];
    const p = res.get(Number(ref.slice(1)));
    return ref[0] === 'G' ? p?.ganador ?? undefined : p?.perdedor ?? undefined;
  };
  for (const p of ordenados) {
    let local = p.local, visitante = p.visitante;
    if (p.fase !== 'grupos' && CRUCES[p.numero]) {
      local ??= origen(CRUCES[p.numero][0]);
      visitante ??= origen(CRUCES[p.numero][1]);
    }
    const jugado = esJugado(p) && !!local && !!visitante;
    const r: PartidoResuelto = { ...p, local, visitante, jugado };
    const cl = porId.get(local ?? '')?.ciclo, cv = porId.get(visitante ?? '')?.ciclo;
    r.ciclo = CICLO_CRUCE[p.numero] ?? (cl && cl === cv ? cl : undefined);
    if (jugado) {
      const gl = ganadorLocal(p);
      r.resultadoLocal = p.goles_local === p.goles_visitante ? 'E' : p.goles_local! > p.goles_visitante! ? 'G' : 'P';
      if (gl !== null) { r.ganador = gl ? local : visitante; r.perdedor = gl ? visitante : local; }
    }
    res.set(p.numero, r);
  }
  const final = res.get(32), tercer = res.get(31);
  return {
    equipos, grupos, clasificados,
    partidos: [...res.values()],
    podio: { campeon: final?.ganador ?? undefined, subcampeon: final?.perdedor ?? undefined, tercero: tercer?.ganador ?? undefined },
  };
}

// ------------------------------------------------------------------ clasificación general por ciclo
/** Tabla "Clasificación" (todos los grupos del ciclo juntos), mismo criterio de orden. */
export function tablaCiclo(torneo: Torneo, ciclo: Ciclo, op: Opciones = {}): FilaTabla[] {
  const filas = Object.values(torneo.grupos).flatMap((g) => g.tabla).filter((f) => f.equipo.ciclo === ciclo);
  const clave = (f: FilaTabla) => (op.fairplaySumaPuntos ? f.Total : f.Pts);
  filas.sort((a, b) => clave(b) - clave(a) || b.DG - a.DG || b.GF - a.GF || a.equipo.nombre.localeCompare(b.equipo.nombre, 'es'));
  return filas.map((f, i) => ({ ...f, posicion: i + 1 }));
}

// ------------------------------------------------------------------ utilidades
/** Deja solo el primer nombre y las iniciales del resto: "Lucas López García" → "LUCAS L.G." (protege a los menores). */
export function abreviarNombre(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return '';
  const resto = partes.slice(1).map((p) => (p.endsWith('.') ? p : p[0].toUpperCase() + '.')).join('');
  return resto ? `${partes[0].toUpperCase()} ${resto}` : partes[0].toUpperCase();
}

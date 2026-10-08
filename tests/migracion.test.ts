// SOLO PARA LA MIGRACIÓN (npm run test:migracion): compara el cálculo con las fórmulas del Google Sheets original.
// Deja de tener sentido cuando se editen los datos desde el CMS; no se ejecuta en el despliegue.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { abrirLibro, valor, slug } from '../scripts/_xlsx.mjs';
import { calcularTorneo, abreviarNombre, type Equipo, type Partido } from '../src/lib/torneo.ts';

const leer = <T>(dir: string): (T & { id: string })[] =>
  fs.readdirSync(`src/content/${dir}`).filter((f) => f.endsWith('.json'))
    .map((f) => ({ id: f.replace('.json', ''), ...JSON.parse(fs.readFileSync(`src/content/${dir}/${f}`, 'utf8')) }));

const equipos = leer<Omit<Equipo, 'id'>>('equipos') as Equipo[];
const partidos = leer<Partido>('partidos');
const opcionesXlsx = JSON.parse(fs.readFileSync('src/content/sitio.json', 'utf8'));

test('la tabla calculada coincide con las fórmulas del xlsx (PJ/PG/PE/PP/GF/GC/DG/Pts de los 16 equipos)', async () => {
  const wb = await abrirLibro();
  const ws = wb.getWorksheet('CLASIFICACION')!;
  const t = calcularTorneo(equipos, partidos);
  const filas = Object.values(t.grupos).flatMap((g) => g.tabla);
  let comprobados = 0;
  for (let r = 4; r <= 30; r++) { // filas de las tablas de grupo
    const nombre = valor(ws.getRow(r).getCell(21));
    const f = filas.find((x) => x.equipo.nombre === nombre);
    if (!f) continue;
    const n = (c: number) => Number(valor(ws.getRow(r).getCell(c)) ?? 0);
    const esperado = { Pts: n(22), PG: n(23), PE: n(24), PP: n(25), GF: n(26), GC: n(27), DG: n(28) };
    // Error conocido del xlsx: la celda Z6 (GF de La Bubineta) está escrita a mano como 13 y no como fórmula.
    // Sus partidos (6+7+1) suman 14 goles → DG +11. El cálculo automático lo corrige.
    if (nombre === 'La Bubineta') { esperado.GF = 14; esperado.DG = 11; }
    const real = { Pts: f.Pts, PG: f.PG, PE: f.PE, PP: f.PP, GF: f.GF, GC: f.GC, DG: f.DG };
    assert.deepEqual(real, esperado, `Equipo ${nombre}`);
    assert.equal(f.FairPlay, n(29), `FairPlay ${nombre}`);
    comprobados++;
  }
  assert.equal(comprobados, 16);
});

test('los cruces calculados coinciden con los equipos reales de las eliminatorias del xlsx', async () => {
  const wb = await abrirLibro();
  const ws = wb.getWorksheet('CLASIFICACION')!;
  const t = calcularTorneo(equipos, partidos, { fairplaySumaPuntos: opcionesXlsx.fairplay_suma_puntos });
  const nombreDe = (id?: string) => equipos.find((e) => e.id === id)?.nombre;
  for (const p of t.partidos.filter((x) => x.numero >= 25)) { // cuartos, semifinales, 3.º puesto y final
    const fila = [...Array(ws.rowCount)].map((_, i) => i + 1).find((r) => Number(valor(ws.getRow(r).getCell(4))) === p.numero)!;
    assert.equal(nombreDe(p.local), valor(ws.getRow(fila).getCell(10)), `local partido ${p.numero}`);
    assert.equal(nombreDe(p.visitante), valor(ws.getRow(fila).getCell(17)), `visitante partido ${p.numero}`);
  }
});

test('ganador del partido 26 se decide por penales', () => {
  const t = calcularTorneo(equipos, partidos);
  const p26 = t.partidos.find((p) => p.numero === 26)!;
  assert.equal(p26.ganador, 'la-bubineta');
});

test('los 4 grupos terminados y el podio coincide con el torneo real', () => {
  const t = calcularTorneo(equipos, partidos);
  assert.ok(Object.values(t.grupos).every((g) => g.terminado));
  const nombre = (id?: string) => equipos.find((e) => e.id === id)?.nombre;
  assert.equal(nombre(t.podio.campeon), 'Rayo Carabinero F.C.');
  assert.equal(nombre(t.podio.subcampeon), 'Zona Gemelos F.C.');
  assert.equal(nombre(t.podio.tercero), 'U.D. Rayo Ferrocarril');
});

test('un partido sin goles no cuenta en la tabla', () => {
  const sin = partidos.map((p) => (p.numero === 1 ? { ...p, goles_local: null, goles_visitante: null } : p));
  const a = calcularTorneo(equipos, partidos).grupos.A.tabla.reduce((n, f) => n + f.PJ, 0);
  const b = calcularTorneo(equipos, sin).grupos.A.tabla.reduce((n, f) => n + f.PJ, 0);
  assert.equal(a - b, 2);
});

test('abreviarNombre protege nombres completos y es idempotente', () => {
  assert.equal(abreviarNombre('Lucas López García'), 'LUCAS L.G.');
  assert.equal(abreviarNombre('LUCAS L.'), 'LUCAS L.');
});

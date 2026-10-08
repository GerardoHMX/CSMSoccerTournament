// Pruebas de la lógica del torneo con datos inventados (no dependen del contenido real).
import test from 'node:test';
import assert from 'node:assert/strict';
import { calcularTorneo, tablaGrupo, grupoTerminado, esJugado, type Equipo, type Partido } from '../src/lib/torneo.ts';

const eq = (id: string, grupo = 'A', ciclo: 'ESO' | 'BCH' = 'ESO', fairplay = 0): Equipo => ({ id, nombre: id.toUpperCase(), ciclo, curso: '1º', grupo, fairplay });
const g = (numero: number, local: string, visitante: string, gl?: number, gv?: number): Partido =>
  ({ numero, fase: 'grupos', grupo: 'A', local, visitante, goles_local: gl, goles_visitante: gv });

const equipos = [eq('a'), eq('b'), eq('c'), eq('d')];

test('3 puntos por victoria, 1 por empate, 0 por derrota; DG y PJ correctos', () => {
  const t = tablaGrupo(equipos, [g(1, 'a', 'b', 2, 0), g(2, 'c', 'd', 1, 1)]);
  const fila = (id: string) => t.find((f) => f.equipo.id === id)!;
  assert.deepEqual([fila('a').Pts, fila('a').PG, fila('a').GF, fila('a').DG, fila('a').PJ], [3, 1, 2, 2, 1]);
  assert.deepEqual([fila('b').Pts, fila('b').PP, fila('b').GC, fila('b').DG], [0, 1, 2, -2]);
  assert.deepEqual([fila('c').Pts, fila('c').PE], [1, 1]);
});

test('los partidos sin goles o cancelados no cuentan', () => {
  assert.equal(esJugado(g(1, 'a', 'b')), false);
  assert.equal(esJugado({ ...g(1, 'a', 'b', 1, 0), estado: 'cancelado' }), false);
  assert.equal(esJugado(g(1, 'a', 'b', 0, 0)), true); // 0-0 sí es un resultado
});

test('desempate: puntos → diferencia de goles → goles a favor → enfrentamiento directo → nombre', () => {
  // a y b empatan a 3 puntos; a tiene mejor DG
  let t = tablaGrupo(equipos, [g(1, 'a', 'c', 3, 0), g(2, 'b', 'd', 1, 0), g(3, 'c', 'b', 1, 0)]);
  assert.equal(t[0].equipo.id, 'a');
  // Igual DG y GF → enfrentamiento directo (b ganó a a)
  t = tablaGrupo([eq('a'), eq('b')], [g(1, 'a', 'b', 0, 1), g(2, 'b', 'a', 0, 1)].slice(0, 1));
  assert.equal(t[0].equipo.id, 'b');
  // Sin nada que los distinga → orden alfabético
  t = tablaGrupo([eq('b'), eq('a')], []);
  assert.deepEqual(t.map((f) => f.equipo.id), ['a', 'b']);
});

test('el Fair Play solo suma a los puntos si se activa', () => {
  const e = [eq('a', 'A', 'ESO', 0), eq('b', 'A', 'ESO', 5)];
  const p = [g(1, 'a', 'b', 1, 0)];
  assert.equal(tablaGrupo(e, p)[0].equipo.id, 'a');
  assert.equal(tablaGrupo(e, p, { fairplaySumaPuntos: true })[0].equipo.id, 'b'); // 0+5 > 3+0
});

test('grupo terminado solo con todos los partidos jugados', () => {
  const todos = [g(1, 'a', 'b', 1, 0), g(2, 'c', 'd', 1, 0), g(3, 'a', 'c', 1, 0), g(4, 'b', 'd', 1, 0), g(5, 'a', 'd', 1, 0), g(6, 'b', 'c', 1, 0)];
  assert.equal(grupoTerminado(equipos, todos), true);
  assert.equal(grupoTerminado(equipos, todos.slice(0, 5)), false);
  assert.equal(grupoTerminado(equipos, [...todos.slice(0, 5), g(6, 'b', 'c')]), false);
});

test('las eliminatorias se rellenan con los clasificados y los ganadores (penales incluidos)', () => {
  const E = ['a', 'b', 'c', 'd'].map((id, i) => eq(id, 'A', 'ESO')).concat(['e', 'f', 'g', 'h'].map((id) => eq(id, 'B', 'ESO')));
  const grupo = (G: string, ids: string[]): Partido[] => {
    const out: Partido[] = []; let n = G === 'A' ? 1 : 7;
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++)
      out.push({ numero: n++, fase: 'grupos', grupo: G, local: ids[i], visitante: ids[j], goles_local: 3 - i, goles_visitante: 0 }); // gana el primero de la lista
    return out;
  };
  const partidos: Partido[] = [
    ...grupo('A', ['a', 'b', 'c', 'd']), ...grupo('B', ['e', 'f', 'g', 'h']),
    { numero: 25, fase: 'cuartos', goles_local: 1, goles_visitante: 1, penales_local: 3, penales_visitante: 4 }, // 1A (a) vs 2B (f)
  ];
  const t = calcularTorneo(E, partidos);
  assert.equal(t.clasificados['1A'], 'a');
  assert.equal(t.clasificados['2B'], 'f');
  const p25 = t.partidos.find((p) => p.numero === 25)!;
  assert.deepEqual([p25.local, p25.visitante, p25.ganador, p25.perdedor], ['a', 'f', 'f', 'a']);
  assert.equal(p25.ciclo, 'ESO');
});

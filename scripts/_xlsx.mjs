// Utilidades compartidas por los scripts de migración (un solo uso).
import ExcelJS from 'exceljs';
import fs from 'node:fs';
import { parse } from 'csv-parse/sync';

// Entrada de datos: si existe scripts/data/csv/*.csv (exportación publicada de Google Sheets) se usa esa;
// si no, se lee el xlsx. Ambas ofrecen la misma interfaz mínima (getWorksheet / getRow / getCell / eachRow).
const DIR_CSV = 'scripts/data/csv';
const NOMBRES_CSV = ['CLASIFICACION', 'EQUIPOS', 'LIDERES', 'SANCIONES', 'NOTICIAS', 'OTROS', 'GALERIA', 'CONFIGURACION'];

function hojaDeCsv(nombre) {
  const filas = parse(fs.readFileSync(`${DIR_CSV}/${nombre}.csv`, 'utf8'), { relax_column_count: true, skip_empty_lines: false });
  const ancho = Math.max(...filas.map((f) => f.length));
  const celda = (r, c) => ({ value: filas[r - 1]?.[c - 1] ?? null });
  return {
    name: nombre, rowCount: filas.length, columnCount: ancho,
    getRow: (r) => ({ getCell: (c) => celda(r, c), eachCell: (fn) => (filas[r - 1] ?? []).forEach((v, i) => fn(celda(r, i + 1), i + 1)) }),
    eachRow: (fn) => filas.forEach((_, i) => fn(hojaDeCsv.fila(filas, i + 1, celda), i + 1)),
  };
}
hojaDeCsv.fila = (filas, r, celda) => ({ eachCell: (fn) => (filas[r - 1] ?? []).forEach((v, i) => fn(celda(r, i + 1), i + 1)) });

export async function abrirLibro(ruta = 'scripts/data/torneo.xlsx') {
  if (NOMBRES_CSV.every((n) => fs.existsSync(`${DIR_CSV}/${n}.csv`))) {
    const hojas = NOMBRES_CSV.map(hojaDeCsv);
    return { worksheets: hojas, getWorksheet: (n) => hojas.find((h) => h.name === n) };
  }
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(ruta);
  return wb;
}

/** Fecha desde un Date (xlsx) o un texto dd/mm/aaaa (CSV). Devuelve Date en UTC o null. */
export function aFecha(v) {
  if (v instanceof Date) return v;
  const m = typeof v === 'string' && v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return m ? new Date(Date.UTC(+m[3], +m[2] - 1, +m[1])) : null;
}

// Valor "visible" de una celda (resultado de la fórmula si la hay).
export function valor(cell) {
  let v = cell.value;
  if (v && typeof v === 'object') {
    if ('formula' in v || 'sharedFormula' in v || 'result' in v) v = v.result ?? null;
    else if (v.richText) v = v.richText.map((t) => t.text).join('');
    else if (v.text) v = v.text;
    else if (v.hyperlink) v = v.hyperlink;
  }
  if (v && typeof v === 'object' && !(v instanceof Date)) v = v.error ? null : String(v);
  if (typeof v === 'string') v = v.trim();
  return v === '' ? null : v ?? null;
}

export function filas(ws, desde = 1, hasta = ws.rowCount) {
  const out = [];
  for (let r = desde; r <= hasta; r++) {
    const row = ws.getRow(r);
    const cols = [];
    for (let c = 1; c <= ws.columnCount; c++) cols.push(valor(row.getCell(c)));
    out.push(cols);
  }
  return out;
}

export const ID_DRIVE = /drive\.google\.com\/(?:file\/d\/|uc\?[^\s"]*id=|open\?id=)([\w-]+)/;
export const idDrive = (u) => (typeof u === 'string' ? u.match(ID_DRIVE)?.[1] ?? null : null);

export const slug = (s) =>
  String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// SCRIPT DE UN SOLO USO: descarga las imágenes públicas de Google Drive referenciadas en el xlsx.
// Usa el endpoint de miniaturas (sz=w1600) → ya viene reducido (≤1600 px). Guarda en scripts/.cache/imagenes
// y escribe un informe con el peso total.
import fs from 'node:fs';
import path from 'node:path';
import { abrirLibro, idDrive } from './_xlsx.mjs';

const OUT = 'scripts/.cache/imagenes';
fs.mkdirSync(OUT, { recursive: true });
const wb = await abrirLibro();
const ids = new Set();
for (const ws of wb.worksheets) {
  if (['request_history', 'Posiciones Auxiliar', 'Resultados Auxiliar'].includes(ws.name)) continue;
  ws.eachRow((row) => row.eachCell((cell) => {
    let v = cell.value;
    if (v && typeof v === 'object') v = v.result ?? v.text ?? v.hyperlink;
    const id = idDrive(v);
    if (id) ids.add(id);
  }));
}
console.log(`IDs de Drive únicos: ${ids.size}`);
let total = 0; const fallos = [];
for (const id of ids) {
  const existente = fs.readdirSync(OUT).find((f) => f.startsWith(id + '.'));
  if (existente) { total += fs.statSync(path.join(OUT, existente)).size; continue; }
  try {
    const r = await fetch(`https://drive.google.com/thumbnail?id=${id}&sz=w1600`, { redirect: 'follow' });
    const tipo = r.headers.get('content-type') || '';
    if (!r.ok || !tipo.startsWith('image/')) throw new Error(`HTTP ${r.status} ${tipo}`);
    const ext = tipo.includes('png') ? 'png' : tipo.includes('webp') ? 'webp' : 'jpg';
    const buf = Buffer.from(await r.arrayBuffer());
    fs.writeFileSync(path.join(OUT, `${id}.${ext}`), buf);
    total += buf.length;
    console.log(`✔ ${id}.${ext}  ${(buf.length / 1024).toFixed(0)} KB`);
  } catch (e) { fallos.push([id, e.message]); console.warn(`✘ ${id}: ${e.message}`); }
}
console.log(`\nPeso total descargado: ${(total / 1048576).toFixed(1)} MB (límite de aviso: 500 MB)`);
if (fallos.length) { console.log('Fallos:', fallos); fs.writeFileSync('scripts/.cache/fallos.json', JSON.stringify(fallos, null, 2)); }

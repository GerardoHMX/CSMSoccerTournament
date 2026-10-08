// SCRIPT DE UN SOLO USO: extrae el diccionario de legacy/js/translations.js a src/i18n/{es,en}.json
import fs from 'node:fs';
const src = fs.readFileSync('legacy/js/translations.js', 'utf8');
const ini = src.indexOf('const translations = ');
const fin = src.indexOf('\n};', ini) + 3;
const obj = new Function(`${src.slice(ini, fin)}; return translations;`)();
for (const lang of Object.keys(obj)) {
  fs.writeFileSync(`src/i18n/${lang}.json`, JSON.stringify(obj[lang], null, 2) + '\n');
  console.log(lang, Object.keys(obj[lang]).length, 'claves');
}

// Navegadores "día a día" de Próximos partidos, Noticias y Galería.
// Todos los elementos están ya en el HTML (ocultos, con data-fecha="AAAA-MM-DD"); aquí decidimos cuáles se ven.

const dia = (clave: string) => { const [y, m, d] = clave.split('-').map(Number); return new Date(y, m - 1, d); };
const clave = (f: Date) => `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`;
const dmy = (c: string) => c.split('-').reverse().join('/');
const esFinde = (f: Date) => f.getDay() === 0 || f.getDay() === 6;
function siguienteLaboral(f: Date) {
  const s = new Date(f); s.setDate(s.getDate() + 1);
  while (esFinde(s)) s.setDate(s.getDate() + 1);
  return s;
}

type Estado = { ancla: string; fin: string };

function iniciar(seccion: HTMLElement, tipo: 'partidos' | 'noticias' | 'galeria') {
  const lista = seccion.querySelector<HTMLElement>('[data-lista]')!;
  const items = Array.from(lista.querySelectorAll<HTMLElement>(':scope > [data-fecha]'));
  const vacio = lista.querySelector<HTMLElement>('[data-vacio]');
  const etiqueta = seccion.querySelector<HTMLElement>('[data-etiqueta]')!;
  const prev = seccion.querySelector<HTMLButtonElement>('[data-nav="anterior"]')!;
  const next = seccion.querySelector<HTMLButtonElement>('[data-nav="siguiente"]')!;
  const fechas = [...new Set(items.map((i) => i.dataset.fecha!))].sort();
  const hoy = clave(new Date());

  const posterior = (c: string) => fechas.find((f) => f > c);
  const anterior = (c: string) => [...fechas].reverse().find((f) => f < c);

  // Día inicial
  let estado: Estado;
  if (tipo === 'partidos') {
    // Hoy si hay partidos; si no, el siguiente día (a menos de 14 días) con partidos; muestra ese día y el siguiente día laborable.
    const proximo = fechas.find((f) => f >= hoy && (dia(f).getTime() - dia(hoy).getTime()) / 864e5 <= 14);
    const ancla = proximo ?? clave(siguienteLaboral(new Date()));
    estado = { ancla, fin: clave(siguienteLaboral(dia(ancla))) };
  } else {
    // Hoy si hay contenido; si no, el día más reciente anterior; si no hay, el primero futuro.
    const ancla = fechas.includes(hoy) ? hoy : (anterior(hoy) ?? posterior(hoy) ?? hoy);
    estado = { ancla, fin: ancla };
  }

  function pintar() {
    const { ancla, fin } = estado;
    let visibles: HTMLElement[];
    if (tipo === 'partidos') {
      visibles = items.filter((i) => i.dataset.fecha! >= ancla && i.dataset.fecha! <= fin);
    } else {
      visibles = items.filter((i) => i.dataset.fecha === ancla);
      if (visibles.length === 1) {
        // Si solo hay un elemento ese día, se completan hasta 2 más de días anteriores (como el sitio original)
        const previos = items.filter((i) => i.dataset.fecha! < ancla).sort((a, b) => b.dataset.fecha!.localeCompare(a.dataset.fecha!)).slice(0, 2);
        visibles = [...previos, ...visibles].sort((a, b) => a.dataset.fecha!.localeCompare(b.dataset.fecha!));
      }
    }
    items.forEach((i) => i.classList.toggle('hidden', !visibles.includes(i)));
    vacio?.classList.toggle('hidden', visibles.length > 0);

    if (tipo === 'partidos') {
      const dias = new Set(visibles.map((v) => v.dataset.fecha));
      const hayVarios = visibles.some((v) => Number(v.dataset.cantidad) > 1);
      lista.classList.toggle('grid', dias.size > 1 && !hayVarios);
      lista.classList.toggle('grid-cols-2', dias.size > 1 && !hayVarios);
      lista.classList.toggle('gap-4', dias.size > 1 && !hayVarios);
      lista.classList.toggle('items-stretch', dias.size > 1 && !hayVarios);
      etiqueta.textContent = ancla === fin || estado.fin === estado.ancla ? dmy(ancla) : `${dmy(ancla)} - ${dmy(fin)}`;
    } else {
      etiqueta.textContent = dmy(ancla);
    }
    const hayAnt = anterior(ancla) !== undefined, haySig = posterior(ancla) !== undefined;
    prev.disabled = !hayAnt; next.disabled = !haySig;
    prev.classList.toggle('opacity-50', !hayAnt); next.classList.toggle('opacity-50', !haySig);
  }

  prev.addEventListener('click', () => {
    const a = anterior(estado.ancla);
    if (!a) return;
    estado = { ancla: a, fin: a };
    pintar();
  });
  next.addEventListener('click', () => {
    const a = posterior(estado.ancla);
    if (!a) return;
    estado = tipo === 'partidos' ? { ancla: a, fin: posterior(a) ?? a } : { ancla: a, fin: a };
    pintar();
  });
  pintar();
}

export function iniciarNavegadores(): void {
  document.querySelectorAll<HTMLElement>('section[data-navegador]').forEach((s) => {
    iniciar(s, s.dataset.navegador as 'partidos' | 'noticias' | 'galeria');
  });
}

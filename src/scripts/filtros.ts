// Pestañas TODOS/ESO/BCH, filtro de grupo (equipos) y filtro de curso (goleadores y sancionados).
// El HTML de todos los ciclos ya está en la página; aquí solo mostramos u ocultamos bloques.

function filtrarCiclo(seccion: HTMLElement, ciclo: string) {
  seccion.querySelectorAll<HTMLElement>(':scope > [data-ciclo]').forEach((b) => {
    b.classList.toggle('hidden', ciclo !== 'TODOS' && b.dataset.ciclo !== ciclo);
  });
}

export function iniciarFiltros(): void {
  document.querySelectorAll<HTMLElement>('section[data-filtro]').forEach((seccion) => {
    const tabs = seccion.querySelector<HTMLElement>('ul.nav-tabs');
    tabs?.querySelectorAll<HTMLButtonElement>('button[data-ciclo]').forEach((boton) => {
      boton.addEventListener('click', (e) => {
        e.preventDefault();
        tabs.querySelectorAll('button').forEach((b) => b.classList.remove('active'));
        boton.classList.add('active');
        filtrarCiclo(seccion, boton.dataset.ciclo!);
        if (seccion.id === 'equipos') actualizarGrupos(seccion);
      });
    });
  });

  // Equipos: filtro por grupo
  const equipos = document.getElementById('equipos');
  if (equipos) {
    equipos.querySelectorAll<HTMLButtonElement>('#selector-grupos-equipos button[data-grupo]').forEach((boton) => {
      boton.addEventListener('click', (e) => {
        e.preventDefault();
        equipos.querySelectorAll('#selector-grupos-equipos button').forEach((b) => b.classList.remove('active'));
        boton.classList.add('active');
        aplicarGrupo(equipos, boton.dataset.grupo!);
      });
    });
  }

  // Goleadores y sancionados: filtro por curso (una "vista" ya preparada por cada curso)
  document.querySelectorAll<HTMLSelectElement>('select[data-vistas]').forEach((sel) => {
    sel.addEventListener('change', () => {
      const bloque = sel.closest<HTMLElement>('[data-ciclo]')!;
      bloque.querySelectorAll<HTMLElement>(':scope [data-vista]').forEach((v) => {
        v.classList.toggle('hidden', v.dataset.vista !== sel.value);
      });
    });
  });
}

function aplicarGrupo(seccion: HTMLElement, grupo: string) {
  seccion.querySelectorAll<HTMLElement>('[data-ciclo] > [data-grupo]').forEach((g) => {
    g.classList.toggle('hidden', grupo !== 'TODOS' && g.dataset.grupo !== grupo);
  });
}

// Solo se ofrecen los grupos del ciclo elegido (A,B → ESO · C,D → BCH)
function actualizarGrupos(seccion: HTMLElement) {
  const ciclo = seccion.querySelector<HTMLElement>('#selector-equipos button.active')?.dataset.ciclo ?? 'TODOS';
  const botones = seccion.querySelectorAll<HTMLButtonElement>('#selector-grupos-equipos button[data-grupo]');
  let reinicio = false;
  botones.forEach((b) => {
    if (b.dataset.grupo === 'TODOS') return;
    const visible = ciclo === 'TODOS' || b.dataset.cicloGrupo === ciclo;
    (b.parentElement as HTMLElement).style.display = visible ? 'flex' : 'none';
    if (!visible && b.classList.contains('active')) reinicio = true;
  });
  if (reinicio) {
    botones.forEach((b) => b.classList.toggle('active', b.dataset.grupo === 'TODOS'));
    aplicarGrupo(seccion, 'TODOS');
  }
}

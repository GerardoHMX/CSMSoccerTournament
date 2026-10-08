# Guía para actualizar la web (sin conocimientos técnicos)

Todo se hace desde **Pages CMS** (<https://app.pagescms.org>) entrando con tu cuenta de GitHub y abriendo el repositorio del torneo.
Cuando pulses **Guardar**, la web se actualiza sola en 1-2 minutos. No hay que tocar nada más.

## Anotar el resultado de un partido (lo más habitual)

1. Menú **⚽ Competición → Resultados y partidos**.
2. Busca el partido (están ordenados por número) y ábrelo.
3. Escribe **Goles del local** y **Goles del visitante**. *(Un 0 es un resultado válido; vacío = aún no jugado.)*
4. Pulsa **Guardar**. La tabla de posiciones, el bracket y el podio se recalculan solos. **No hay que escribir puntos ni posiciones.**

**Eliminatorias** (cuartos, semifinales, tercer puesto, final): los equipos se rellenan solos cuando terminan los grupos y las rondas
anteriores. Solo escribe los goles. Si hubo **empate y penales**, escribe también *Penales del local/visitante*.
(Si pones un empate en una eliminatoria sin penales, la web no se publica y verás el aviso en la pestaña *Actions* de GitHub.)

**Cambiar fecha u hora**: abre el partido, cambia *Fecha* (selector de calendario) y *Hora* (formato 10:15).

**Partido cancelado**: en *Estado* elige «Cancelado».

## Equipos
**⚽ Competición → Equipos**. Para añadir uno: *Añadir* → nombre, ciclo, curso, grupo, **Puntos de Fair Play** y logo (sube la imagen desde tu equipo).
Los desplegables de equipos en el resto de formularios se actualizan solos.

## Goleadores y sancionados
**Líderes goleadores** y **Sancionados**: abre la lista, *Añadir* un jugador (equipo en desplegable) y sus números.
Escribe solo **nombre e iniciales** («LUCAS L.») para proteger a los menores: aunque pongas el nombre completo, la web lo abrevia.

## Noticias
**📰 Noticias y galería → Noticias → Añadir**: título, fecha, créditos, hasta 5 fotos (la primera es la portada) y el texto.
Desmarca *Publicar en la web* para dejarla como borrador.

## Galería
**Galería → Añadir**: fecha, tipo (foto o vídeo). Las fotos se suben desde tu equipo (mejor de ≤ 2 MB).
Los **vídeos NO se suben**: pega el enlace de YouTube o de Google Drive en *Enlace del vídeo*.

## Textos fijos
**📝 Textos y ajustes**
* **Bases del torneo**: tarjetas del carrusel/acordeón. Usa **negrita** para resaltar en azul.
* **Datos del torneo y del colegio**: nombre, año, teléfonos, correo, enlaces, logos.
* **Secciones visibles y menú**: interruptores para mostrar/ocultar cada sección. No cambies el identificador.

## Si algo sale mal
* Cada guardado queda en el historial de GitHub (pestaña *Commits*): siempre se puede volver atrás.
* Si la web no se actualiza, entra en GitHub → pestaña **Actions**: la ejecución en rojo explica el problema en español
  (por ejemplo «Partido 25: empate en eliminatoria; indica los penales»).

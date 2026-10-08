// Esquemas de los contenidos. Si un dato es inválido, `npm run build` falla con un mensaje claro
// en vez de publicar una web rota. (Concepto Astro: "Content Collections")
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const imagen = z.string().regex(/^\/src\/assets\/.+\.(png|jpe?g|webp|avif|gif|svg)$/i, 'Debe ser una imagen subida desde el CMS (carpeta src/assets)');
const siNo = z.boolean();
// Pages CMS puede guardar la referencia a un equipo como "macarroneros", "macarroneros.json" o con ruta completa; nos quedamos con el id.
const equipoRef = z.string().min(1, 'Elige un equipo').transform((v) => v.split('/').pop()!.replace(/\.json$/i, ''));
// Un campo numérico vacío en el CMS puede llegar como "" → lo tratamos como "sin dato"
const golesOpc = z.preprocess((v) => (v === '' || v === undefined ? null : v), z.number().int().min(0).nullish());

const equipos = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/equipos' }),
  schema: z.object({
    nombre: z.string().min(1),
    ciclo: z.enum(['ESO', 'BCH']),
    curso: z.string().min(1),
    grupo: z.enum(['A', 'B', 'C', 'D']),
    logo: imagen.nullish(),
    fairplay: z.number().int().min(0).default(0),
    orden: z.number().int().min(1).default(99),
  }),
});

const partidos = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/partidos' }),
  schema: z
    .object({
      numero: z.number().int().positive(),
      fase: z.enum(['grupos', 'cuartos', 'semifinal', 'tercer_puesto', 'final']),
      grupo: z.enum(['A', 'B', 'C', 'D']).optional(),
      fecha: z.coerce.date().optional(),
      hora: z.string().regex(/^\d{1,2}:\d{2}$/, 'Formato de hora: HH:MM').optional(),
      local: equipoRef.optional(),
      visitante: equipoRef.optional(),
      goles_local: golesOpc,
      goles_visitante: golesOpc,
      penales_local: golesOpc,
      penales_visitante: golesOpc,
      estado: z.enum(['programado', 'jugado', 'cancelado']).optional(),
    })
    .superRefine((p, ctx) => {
      const hay = (v: unknown) => typeof v === 'number';
      if (hay(p.goles_local) !== hay(p.goles_visitante))
        ctx.addIssue({ code: 'custom', message: `Partido ${p.numero}: faltan los goles de uno de los dos equipos` });
      if (p.fase === 'grupos' && (!p.grupo || !p.local || !p.visitante))
        ctx.addIssue({ code: 'custom', message: `Partido ${p.numero}: en fase de grupos hay que indicar grupo, local y visitante` });
      if (p.local && p.visitante && p.local === p.visitante)
        ctx.addIssue({ code: 'custom', message: `Partido ${p.numero}: local y visitante son el mismo equipo` });
      if (p.fase !== 'grupos' && hay(p.goles_local) && p.goles_local === p.goles_visitante &&
          p.penales_local === p.penales_visitante)
        ctx.addIssue({ code: 'custom', message: `Partido ${p.numero}: empate en eliminatoria; indica los penales` });
    }),
});

const noticias = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/noticias' }),
  schema: z.object({
    titulo: z.string().min(1),
    fecha: z.coerce.date(),
    autor: z.string().default(''),
    publicar: siNo.default(true),
    imagenes: z.array(imagen).max(5).default([]),
  }),
});

const galeria = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/galeria' }),
  schema: z.object({
    fecha: z.coerce.date(),
    tipo: z.enum(['imagen', 'video']),
    publicar: siNo.default(true),
    titulo: z.string().optional(),
    imagen: imagen.nullish(),
    video_url: z.string().url().optional(),
  }),
});

// Archivos únicos (una sola entrada cada uno)
const unico = <T extends z.ZodTypeAny>(archivo: string, schema: T) =>
  defineCollection({ loader: glob({ pattern: archivo, base: './src/content' }), schema });

const sitio = unico('sitio.json', z.object({
  torneo_nombre: z.string(), torneo_anio: z.string(), torneo_descripcion: z.string(),
  torneo_logo: imagen.nullish(),
  colegio_nombre: z.string(), colegio_telefono1: z.string(), colegio_telefono2: z.string().optional(),
  colegio_email: z.string(), colegio_direccion: z.string(), colegio_localidad: z.string(),
  colegio_provincia: z.string(), colegio_maps_url: z.string().url(), colegio_url: z.string().url(),
  colegio_logo: imagen.nullish(),
  instagram_url: z.string().url(), ga_tracking_id: z.string().optional(), feedback_script_url: z.string().optional(),
  fairplay_suma_puntos: siNo.default(false),
}));

const secciones = unico('secciones.json', z.object({
  secciones: z.array(z.object({ id: z.string(), nombre: z.string(), en_menu: siNo, visible: siNo })),
}));

const bases = unico('bases.json', z.object({
  tarjetas: z.array(z.object({
    titulo: z.string(), activa: siNo.default(true), centrado: siNo.default(false),
    imagen: imagen.nullish(), pie_imagen: z.string().optional(),
    contenido: z.string().default(''),
  })),
}));

const goleadores = unico('goleadores.json', z.object({
  jugadores: z.array(z.object({ equipo: equipoRef, jugador: z.string().min(1), goles: z.number().int().min(0) })),
}));

const sanciones = unico('sanciones.json', z.object({
  jugadores: z.array(z.object({
    equipo: equipoRef, jugador: z.string().min(1),
    rojas: z.number().int().min(0).default(0), amarillas: z.number().int().min(0).default(0),
    suspendidos: z.number().int().min(0).default(0),
  })),
}));

const avatares = unico('avatares.json', z.object({
  avatares: z.array(z.object({ ciclo: z.enum(['ESO', 'BCH']), posicion: z.number().int().min(1).max(3), imagen: imagen })),
}));

export const collections = { equipos, partidos, noticias, galeria, sitio, secciones, bases, goleadores, sanciones, avatares };

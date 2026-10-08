// Punto de entrada del JavaScript del navegador. (Concepto Astro: este <script> se empaqueta y se envía solo a la página.)
import 'bootstrap/js/dist/collapse';
import { iniciarIdioma } from './i18n';
import { iniciarFiltros } from './filtros';
import { iniciarNavegadores } from './dias';
import { iniciarCarrusel } from './carrusel';
import { iniciarNoticias, iniciarGaleria } from './modales';
import { iniciarMenu } from './ui';
import { iniciarFeedback } from './feedback';

iniciarMenu();
iniciarFiltros();
iniciarNavegadores();
iniciarCarrusel();
iniciarNoticias();
iniciarGaleria();
iniciarFeedback();
iniciarIdioma();

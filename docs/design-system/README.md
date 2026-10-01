# Sistema de diseño de ParkApp

Página viva: `npm run dev` en `frontend/` y abrir **/design-system** (español e inglés, móvil y escritorio).
Código: tokens en `frontend/src/index.css`, componentes en `frontend/src/components/ui/`, página de muestra en `frontend/src/styleguide/`.

## Principios

1. **El azul es la marca; el ámbar es la acción.** Navegación, enlaces y el boleto van en azul profundo. Reservar, pagar y publicar son los únicos botones ámbar, y hay uno por pantalla.
2. **El boleto es el objeto memorable.** Una reserva confirmada es un boleto de evento con talón perforado. El resto del sistema es sobrio para que el boleto destaque.
3. **Mapa primero.** En el teléfono el mapa llena la pantalla y la lista vive en un panel de tres alturas (Uber). En escritorio la lista queda junto al mapa y se sincroniza al pasar el cursor (Airbnb). Es el mismo componente: reacciona al ancho de su contenedor, no de la ventana.
4. **Foto, precio y reseñas siempre visibles** en cada tarjeta.
5. **Cuatro pasos como máximo** para reservar; cuatro en orden para publicar.
6. **Accesible por construcción.** Contraste AA verificado por pruebas, objetivos de 44 px, foco visible, `prefers-reduced-motion`.

## Tokens

| Grupo            | Tokens                                                                                                                                 |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Marca            | `signal-50…900`; `signal-700` (#0F3D91) es el azul de marca                                                                            |
| Acción           | `ticket-50/200/400/500/700`; `ticket-400` (#FFB21A) es el relleno de acción, nunca texto ni contorno sobre fondo claro                 |
| Neutros          | `ink`, `ink-muted`, `ink-subtle`, `line` (solo divisores), `control` (bordes de campos), `canvas`, `surface`                           |
| Estados          | `success-50/600`, `danger-50/600`, `warning-50/700`                                                                                    |
| Roles            | `primary`, `primary-hover`, `primary-soft`, `action`, `action-hover`                                                                   |
| Tipografía       | Bricolage Grotesque (titulares, precios) + Figtree (interfaz). Escala: caption 13, body 16, lead 18, title 20, headline 28, display 40 |
| Forma            | `rounded-control` 12, `rounded-surface` 20, `rounded-sheet` 28, `rounded-full`                                                         |
| Tamaños táctiles | `h-touch` 44 px, `h-touch-lg` 52 px                                                                                                    |
| Elevación        | `shadow-raised`, `shadow-sheet`, `shadow-pin`                                                                                          |
| Movimiento       | `ease-out-quint`; una sola animación ambiental (pulso), más carga con `shimmer`. Todo se desactiva con `prefers-reduced-motion`        |

Regla: lo que la persona debe _encontrar_ (borde de un campo, el riel de un interruptor) usa `control` (3,5:1). `line` es decoración.

### Contraste verificado

`frontend/src/lib/contrast.test.ts` falla si un color de `index.css` cambia sin actualizar `styleguide/tokens.ts`, o si alguna de las 17 combinaciones que usan los componentes baja de WCAG AA (4,5:1 texto, 3:1 gráficos). La tabla se muestra en la página de muestra.

## Componentes

| Componente                | Para qué                                                                                                        | Notas de accesibilidad                                                                                                                                                               |
| ------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Button`                  | Acciones. Variantes `action`, `brand`, `secondary`, `ghost`, `danger`; tamaños `md` (44) y `lg` (52); `loading` | `type="button"` por defecto; `aria-busy` y deshabilitado al cargar                                                                                                                   |
| `IconButton`              | Acción solo con icono                                                                                           | `label` obligatorio                                                                                                                                                                  |
| `Input`                   | Campo con etiqueta, ayuda y error                                                                               | Etiqueta asociada; `aria-describedby`; error con `role="alert"` y borde, no solo color                                                                                               |
| `Chip`                    | Filtro de selección                                                                                             | `aria-pressed`; el seleccionado también invierte colores                                                                                                                             |
| `Badge`                   | Estado corto (`success`, `warning`, `danger`, `brand`, `neutral`)                                               | El texto lleva el significado                                                                                                                                                        |
| `Segmented`               | Una opción entre 2 a 4                                                                                          | `fieldset` + radios nativos: flechas del teclado y lector de pantalla gratis; `lang` por opción                                                                                      |
| `Switch`                  | Ajuste de encendido o apagado                                                                                   | `role="switch"`, `aria-checked`, área de 44 px                                                                                                                                       |
| `Rating`                  | Calificación y número de reseñas                                                                                | Frase completa para lectores de pantalla                                                                                                                                             |
| `PriceTag`                | Precio por hora desde centavos enteros                                                                          | Cifras tabulares                                                                                                                                                                     |
| `Skeleton`, `EmptyState`  | Carga y vacío                                                                                                   | El vacío dice qué falta y qué hacer; sin disculpas                                                                                                                                   |
| `SpacePhoto`, `SpaceCard` | Foto ilustrada de marcador y tarjeta tipo Airbnb                                                                | Tarjeta entera como un solo botón con título como nombre; `layout="row"` dentro del panel                                                                                            |
| `StepIndicator`           | Paso X de 4                                                                                                     | `ol`, `aria-current="step"`, texto "Paso 2 de 4"                                                                                                                                     |
| `TopBar`, `BottomNav`     | Navegación                                                                                                      | Sin acoplarse al router: reciben callbacks; `aria-current="page"`                                                                                                                    |
| `TicketStub`              | Reserva confirmada                                                                                              | Cada mitad recorta sus propias esquinas; el código va impreso como texto, las barras son decorativas                                                                                 |
| `MapPlaceholder`          | Mapa ilustrado hasta conectar Google Maps                                                                       | Pines como botones con `aria-pressed` y nombre "título, precio por hora"                                                                                                             |
| `BottomSheet`             | Panel de tres alturas (`peek`, `half`, `full`)                                                                  | El asa es un botón: Enter alterna, flechas arriba y abajo cambian la altura. Colapsado, el contenido es `inert` e invisible. Arrastre con puntero con ajuste a la altura más cercana |
| `MapListLayout`           | Mapa + panel                                                                                                    | Container query: a partir de 768 px de ancho del contenedor el panel se acopla como lista lateral                                                                                    |

## Capturas

`docs/design-system/screenshots/`, generadas con `SCREENSHOTS=1 npx playwright test screenshots` (móvil Pixel 7 y escritorio 1280):

| Sección           | Móvil                     | Escritorio                 |
| ----------------- | ------------------------- | -------------------------- |
| Color             | `mobile-colors.png`       | `desktop-colors.png`       |
| Contraste         | `mobile-contrast.png`     | `desktop-contrast.png`     |
| Tipografía        | `mobile-type.png`         | `desktop-type.png`         |
| Controles         | `mobile-controls.png`     | `desktop-controls.png`     |
| Tarjetas y boleto | `mobile-cards.png`        | `desktop-cards.png`        |
| Navegación        | `mobile-navigation.png`   | `desktop-navigation.png`   |
| Mapa y lista      | `mobile-patterns.png`     | `desktop-patterns.png`     |
| Panel colapsado   | `mobile-sheet-1-peek.png` | `desktop-sheet-1-peek.png` |
| Panel expandido   | `mobile-sheet-3-full.png` | `desktop-sheet-3-full.png` |

## Verificación automática

- **Vitest (66 pruebas):** contraste y tokens, componentes (botón, campo, selección, interruptor, pasos, tarjeta, panel), dinero, fechas, i18n y servicios.
- **Playwright (8 pruebas × móvil y escritorio; 15 se ejecutan y 1 solo aplica a escritorio):** axe WCAG 2.1 A y AA sin violaciones en español e inglés; ningún control interactivo menor de 44 px; el panel funciona con teclado y su contenido colapsado queda fuera del orden de foco; arrastrar el asa cambia la altura con ajuste a la más cercana; seleccionar o pasar el cursor sobre una tarjeta resalta su pin; el panel es hoja en contenedor angosto y lista lateral en uno ancho.

## Límites conocidos

- **Mapa y fotos son ilustraciones de marcador.** Mapa real con Google Maps y fotos reales desde Cloud Storage llegan cuando se pida.
- **Sin modo oscuro.** Los tokens están organizados por roles para añadirlo después.
- **Texto de ejemplo.** Los nombres de cocheras, precios y la dirección de la muestra son ficticios (`samples.*` en los archivos de i18n).
- **No probado con lector de pantalla real** (VoiceOver, TalkBack, NVDA). axe cubre estructura y contraste, no cómo se anuncia.
- **Arrastre del panel** probado con eventos de puntero (ratón) en Chrome de escritorio y en emulación móvil, no con gestos táctiles en un teléfono físico.

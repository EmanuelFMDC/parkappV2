# Pantallas del anfitrión (Fase 4)

Publicar una cochera es un flujo de **cuatro pasos en orden**: Ubicación, Dimensiones, Fotos y Precio. Antes hace falta una cuenta con datos personales e **identidad verificada** (no pide auto). Una cochera nueva **no sale al público hasta que el back-office la aprueba**. Para verlo: `npm run dev` en `frontend/`, abrir **/host**. La API es simulada en el navegador (D-014).

## Dos modos, una sola cuenta

La app tiene **modo conductor** (buscar y reservar) y **modo anfitrión** (publicar y gestionar). Es la misma cuenta, el mismo inicio de sesión y la misma identidad verificada; cada modo tiene su propia barra inferior.

|                | Modo conductor                                                  | Modo anfitrión                                                                                  |
| -------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Barra inferior | Explorar · Mis reservas · Perfil                                | Mis cocheras · Reservas · Perfil                                                                |
| Aviso          | ninguno                                                         | franja oscura "Modo anfitrión" con "Cambiar a modo conductor", en todas las pantallas con barra |
| Direcciones    | `/`, `/bookings`, `/profile`                                    | `/host`, `/host/bookings`, `/host/profile`                                                      |
| Perfil         | datos, idioma, **autos**, tarjeta para cambiar a modo anfitrión | los mismos datos e idioma, **sin autos**                                                        |

- **El modo lo decide la dirección** (todo lo que empieza con `/host`), no un estado oculto. Por eso los enlaces, recargar y el botón de atrás siempre coinciden con lo que se ve.
- **Cómo se entra al modo anfitrión:** desde el Perfil ("Cambiar a modo anfitrión") o desde la invitación discreta al final de Explorar ("¿Tienes una cochera?"). Se puede mirar sin tener cuenta: la cuenta se pide cuando hace falta, al empezar a publicar.
- **Cómo se vuelve:** un toque en el aviso de arriba.
- **Los enlaces viejos** (`/host?tab=bookings`) redirigen a `/host/bookings`.
- Las pantallas de publicar (`/host/new/...`) no muestran barra ni aviso para no distraer.

## El flujo

| Pantalla            | Ruta                   | Qué hace el anfitrión                                                                                   |
| ------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------- |
| Anfitrión           | `/host`                | Quien aún no es anfitrión ve la invitación. Quien ya lo es ve **Mis cocheras** y **Reservas recibidas** |
| Cuenta de anfitrión | `/account/new?as=host` | Teléfono, datos personales e identidad (3 etapas, sin auto). Al terminar vuelve a donde iba             |
| 1. Ubicación        | `/host/new/location`   | Recinto cercano, calle, colonia, municipio, referencias y el pin de la entrada en el mapa               |
| 2. Dimensiones      | `/host/new/size`       | Largo, ancho y altura; autos que caben (sugeridos) y qué ofrece                                         |
| 3. Fotos            | `/host/new/photos`     | De 3 a 8 fotos, título y descripción                                                                    |
| 4. Precio           | `/host/new/price`      | Precio por hora, resumen y reglas para anfitriones; publica                                             |
| Listo               | `/host/new/done`       | "Tu cochera está en revisión"                                                                           |

Los pasos 2 a 4 **no se pueden saltar** escribiendo la dirección: cada uno envía al primer paso anterior que siga incompleto. El borrador se guarda en la pestaña (`sessionStorage`), así que recargar no pierde lo capturado, y nunca sale del navegador hasta publicar.

## Reglas de dominio

- **Revisión previa.** La cochera nace `pending_review` y solo aparece en las búsquedas cuando pasa a `active`. Si el back-office la rechaza, el anfitrión ve el motivo y puede publicar de nuevo. (En producción esto es Django Admin; aquí se simula y se aprueba sola a los 5 segundos.)
- **Radio de 3 km.** El pin debe quedar a menos de 3 km del recinto; la pantalla lo dice en texto, no solo con color, y el servidor lo vuelve a comprobar.
- **Autos sugeridos según las medidas** (regla orientativa, editable): compacto desde 400 × 220 cm, sedán desde 470 × 240, SUV desde 500 × 250 con 200 cm de altura, pick-up desde 560 × 260 con 210 cm. Si el anfitrión los cambia a mano, las medidas dejan de sobrescribirlos.
- **Fotos:** de 3 a 8, JPG, PNG o WebP, de hasta 10 MB. Se suben con el servicio de almacenamiento (URLs firmadas en producción). La primera es la portada.
- **Precio:** entero en centavos, entre $20 y $500 por hora. Los conductores pagan además el cargo por servicio.
- **Pausar y reactivar.** Una cochera pausada desaparece de las búsquedas; las reservas ya confirmadas siguen en pie. También se puede cambiar el precio.
- **Una cochera en revisión o rechazada no se puede pausar ni reactivar** (409).
- **Un anfitrión no puede reservar su propia cochera** (422 `own_space`).
- **Sin duplicados:** no se publica dos veces la misma dirección en el mismo recinto (409).
- **Lo que ve el anfitrión de un conductor:** nombre de pila, insignia de identidad verificada, su auto (marca, modelo, color y placa) y el precio de la reserva. **Nunca teléfono, correo ni INE**, y hay una prueba que lo comprueba sobre la respuesta.
- **Lo que ven los conductores del anfitrión:** nombre de pila e inicial del apellido ("Marisol R."). Una cochera sin reseñas dice "Nueva" en lugar de un 0.0 engañoso.

## Contrato de la API

Se añadió a `backend/openapi.draft.yaml`: `GET` y `POST /api/host/spaces`, `PATCH /api/host/spaces/{spaceId}` y `GET /api/host/bookings`. La verificación de identidad ya no exige un auto registrado (los anfitriones no tienen).

## Capturas

`docs/host/screenshots/` (móvil Pixel 7 y escritorio 1280; se regeneran con `SCREENSHOTS=1 npx playwright test host-screenshots`):

| Pantalla                  | Archivo (`mobile-` y `desktop-`) |
| ------------------------- | -------------------------------- |
| Invitación                | `1-intro`                        |
| 1. Ubicación              | `2-location`                     |
| 2. Dimensiones            | `3-size`                         |
| 3. Fotos                  | `4-photos`                       |
| 4. Precio                 | `5-price`                        |
| Listo                     | `6-done`                         |
| Mis cocheras, en revisión | `7-home-in-review`               |
| Mis cocheras, publicada   | `8-home-live`                    |
| Reservas recibidas        | `9-bookings-received`            |

## Verificación automática

- **318 pruebas unitarias y de pantalla (Vitest)**, de ellas las nuevas del anfitrión: reglas del dominio (revisión, rechazo, validaciones de cada campo y sus bordes, duplicados, pausar, precio, propiedad, qué ve el anfitrión, persistencia), validaciones por paso y que no se pueda saltar uno, medidas y autos sugeridos, selector de pin, carga de fotos (tipo, tamaño, máximo, quitar), publicar, panel y registro de anfitrión sin auto.
- **77 pruebas de punta a punta (Playwright, móvil y escritorio), con axe WCAG 2.1 AA en cada pantalla:** alta completa desde cero hasta que un conductor la encuentra, mensajes de cada paso incompleto, pin fuera del radio, pasos que no se saltan, borrador que sobrevive a recargar, rechazo con motivo, pausar y reactivar con cambio de precio visto desde el lado del conductor, el anfitrión viendo una reserva sin datos privados, no reservar la propia cochera e inglés.

## Defectos que encontró la verificación (ya corregidos)

- **Tras publicar, el anfitrión volvía al paso 1** en lugar de llegar a "Tu cochera está en revisión": al limpiar el borrador, el control de pasos veía datos vacíos y redirigía antes de navegar.
- El indicador "Paso 1 de 4" aparecía dos veces (arriba y en la barra de abajo). Ahora la barra dice cuál es el siguiente paso.
- Una referencia que se actualizaba durante el renderizado y archivos que mezclaban componentes con funciones, señalados por el lint.

## Límites conocidos

- **El mapa es una ilustración.** El pin se coloca tocando o con las flechas (50 m por pulsación) y no hay búsqueda de direcciones; el mapa real y la geocodificación llegan con Google Maps.
- **Las fotos no se guardan de verdad** en la API simulada: se muestran como ilustraciones tras recargar. El servicio de almacenamiento real (Cloud Storage) llega cuando se pida.
- **Aprobación simulada.** En la práctica la hace una persona en Django Admin, con su propio tiempo y criterios.
- **Las "reglas para anfitriones" son un texto provisional** que debe redactar y revisar un abogado, igual que el aviso de privacidad.
- **Falta:** editar los demás datos de una cochera ya publicada, eliminarla, cobros al anfitrión (Stripe Connect), cancelaciones iniciadas por el anfitrión, reseñas del anfitrión a conductores y mensajes entre ambos.
- **Reserva instantánea.** El anfitrión no aprueba cada reserva.
- Sigue sin probarse con lector de pantalla real ni en un teléfono físico.

## Cambio de modo (D-018)

- **Pruebas unitarias:** cada modo muestra su barra y no la del otro, la pestaña actual está marcada, el aviso aparece solo en modo anfitrión y lleva de vuelta en un toque, el Perfil ofrece el cambio correcto y oculta los autos en modo anfitrión, la invitación es un enlace a `/host`, y los enlaces viejos redirigen.
- **De punta a punta (móvil y escritorio, con axe):** pasar de conductor a anfitrión y de vuelta, moverse entre las pestañas de cada modo, que el botón de atrás y adelante sigan al modo, la invitación en Explorar, mirar el modo anfitrión sin cuenta, la redirección de enlaces viejos y la traducción del aviso.
- **Capturas nuevas:** `0-explore-invitation`, `10-profile-driver-mode` y `11-profile-host-mode` en `docs/host/screenshots/`.
- **Defecto que encontró la revisión:** en el Perfil de modo anfitrión aparecían dos botones idénticos "Cambiar a modo conductor" (el aviso y una tarjeta). Se dejó solo el aviso. Además, "Completar mi cuenta" y "Cerrar sesión" salían pegados.

## Recordar el último modo (D-019)

- La app guarda el modo en el dispositivo y, al abrirla en `/`, lleva a un anfitrión con cuenta lista a su modo. Una sola vez por pestaña; enlaces, recargas y "Explorar" nunca saltan. Cerrar sesión lo olvida.
- **Pruebas:** 14 de integración (`modeMemory.test.tsx`), las de `modePreference.test.ts` y 4 e2e que abren la app en una pestaña nueva (`mode-switch.spec.ts`).

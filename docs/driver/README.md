# Pantallas del conductor (Fase 3)

Reservar una cochera toma **cuatro pasos como máximo**: Recinto, Cochera, Horario y Pago. Para verlo: `npm run dev` en `frontend/` y abrir **/**. La API es simulada en el navegador (D-014), así que funciona sin backend.

## El flujo

| Paso         | Ruta                                           | Qué hace la persona                                                                               |
| ------------ | ---------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 1. Recinto   | `/`                                            | Elige recinto y evento. Se prellena llegada 2 h antes y salida 1 h después                        |
| 2. Cochera   | `/venues/:venueId/spaces` y `/spaces/:spaceId` | Mapa y lista con disponibilidad en vivo; abre el detalle de una cochera (fotos, reseñas, medidas) |
| 3. Horario   | `/book/:spaceId/time`                          | Ajusta llegada y salida, escribe la placa y ve el precio exacto                                   |
| 4. Pago      | `/book/:spaceId/pay`                           | Inicia sesión si hace falta y paga. Aquí se crea la reserva                                       |
| Boleto       | `/bookings/:bookingId`                         | Boleto con código y dirección exacta; puede cancelar                                              |
| Mis reservas | `/bookings`                                    | Lista de reservas                                                                                 |
| Perfil       | `/profile`                                     | Idioma y sesión                                                                                   |

El viaje (recinto y horario) vive en la **URL** (`?venue=…&from=…&to=…`), así que el botón de atrás, recargar y compartir el enlace funcionan. La placa se guarda solo en la pestaña (`sessionStorage`), nunca en la URL.

## Reglas de dominio que el frontend respeta

- **Sin doble reserva.** Si alguien reserva la cochera mientras la persona paga, el servidor responde 409 y la pantalla lo explica y ofrece elegir otra. Si la lista ya estaba abierta, la cochera pasa a "No disponible" sola (consulta cada 15 s y al volver a la ventana; sin WebSockets).
- **Apartado de 10 minutos.** La reserva nace como `pending_payment`. Si el pago falla, no se confirma ni se entrega código o dirección, y el lugar se libera al vencer.
- **Dirección exacta solo tras confirmar.** Antes se ve únicamente la zona. Es una regla de privacidad entre particulares.
- **Dinero en centavos enteros y fechas en UTC.** El precio lo calcula el servidor (`/quote`); el cliente solo lo muestra. Las fechas se capturan y se muestran en hora de Ciudad de México.
- **Cancelación gratis hasta 10 minutos antes de la llegada.**
- **Cada conductor solo ve sus reservas.**

## Contrato de la API

`backend/openapi.draft.yaml` es el contrato que el backend (Fase 5) deberá cumplir. Los tipos del cliente se generan con `npm run api:types` y ningún formato de respuesta se escribe a mano en el frontend. Endpoints: recintos, eventos, búsqueda de cocheras con disponibilidad, detalle, reseñas, cotización, reservas (crear, listar, ver, confirmar, cancelar) y perfil.

## API simulada

`frontend/src/mocks/` implementa esas reglas: `domain/db.ts` (reservas, disponibilidad, expiración, cancelación), `pricing.ts`, `geo.ts`, `seed.ts` (5 recintos con 6 cocheras cada uno, eventos siempre futuros, reseñas) y `handlers.ts` (MSW). Las reservas y la sesión de demostración persisten en `localStorage`. Al primer evento de cada recinto ya hay dos cocheras ocupadas, para ver ese estado.

Se activa con `VITE_USE_MOCK_API=true` (archivos `.env.development` y `.env.e2e`). **No viaja en producción:** el chunk y el `mockServiceWorker.js` se eliminan de la compilación. Para pasar al backend real basta con quitar la bandera y fijar `VITE_API_URL`.

## Capturas

`docs/driver/screenshots/` (móvil Pixel 7 y escritorio 1280; se regeneran con `SCREENSHOTS=1 npx playwright test driver-screenshots`):

| Pantalla                          | Móvil                                                 | Escritorio                                              |
| --------------------------------- | ----------------------------------------------------- | ------------------------------------------------------- |
| 1. Recinto y evento               | `mobile-1-venue.png`                                  | `desktop-1-venue.png`                                   |
| 2. Mapa y lista                   | `mobile-2-spaces.png`                                 | `desktop-2-spaces.png`                                  |
| 2. Detalle                        | `mobile-3-detail.png`, `mobile-3b-detail-reviews.png` | `desktop-3-detail.png`, `desktop-3b-detail-reviews.png` |
| 3. Horario                        | `mobile-4-time.png`                                   | `desktop-4-time.png`                                    |
| 4. Pago (sin sesión y con sesión) | `mobile-5-pay-signin.png`, `mobile-5b-pay.png`        | `desktop-5-pay-signin.png`, `desktop-5b-pay.png`        |
| Boleto                            | `mobile-6-ticket.png`                                 | `desktop-6-ticket.png`                                  |
| Mis reservas                      | `mobile-7-bookings.png`                               | `desktop-7-bookings.png`                                |
| Perfil                            | `mobile-8-profile.png`                                | `desktop-8-profile.png`                                 |

## Verificación automática

- **112 pruebas unitarias y de pantalla (Vitest):** reglas de la API simulada (doble reserva, precios sin fracciones, expiración, privacidad de la dirección, cancelación, persistencia), proyección al mapa, fechas, el paso 1 y el paso 4 (pago correcto, pago fallido que no confirma, cochera tomada por otra persona), inicio de sesión, y que **no falte ninguna traducción** (la prueba falla si el código pide una clave inexistente).
- **35 pruebas de punta a punta (Playwright, móvil y escritorio):** el flujo completo de cuatro pasos hasta el boleto y la cancelación, con **axe WCAG 2.1 AA en cada pantalla**; doble reserva mientras se paga; la lista que marca "No disponible" cuando otra persona reserva; sesión y reservas que sobreviven a recargar; inglés; página 404.

## Defectos que encontró la revisión (ya corregidos)

- La barra con "Ver cocheras" quedaba **debajo** de la navegación inferior, que interceptaba los clics.
- Pines de cocheras cercanas montados sobre el marcador del recinto (escala lineal; ahora raíz cuadrada).
- Código de barras del boleto a un tercio del ancho; título largo cortado con puntos suspensivos.
- Encabezado desalineado con el contenido en escritorio.
- Una lista de definición inválida que axe señaló.
- La API simulada viajaba en la compilación de producción.

## Límites conocidos

- **Mapa y fotos son ilustraciones**; el mapa real (Google Maps) y las fotos reales (Cloud Storage) llegan cuando se pidan.
- **Pagos, SMS y Google son simulados.** El código de verificación de prueba es `000000`.
- **Datos de ejemplo.** Los recintos usan los nombres de la spec con coordenadas aproximadas que hay que verificar. Los textos de cocheras y reseñas vienen de la API y no se traducen.
- **El selector de fecha es el nativo del navegador**, así que su formato depende del idioma del navegador; el resumen de abajo repite la fecha con el día de la semana para evitar confusiones.
- **Sin reseñas nuevas, notificaciones ni cobro de cancelación tardía.** Falta aplicar el idioma del perfil al iniciar sesión (hoy se guarda al cambiarlo).
- **No probado con lector de pantalla real** (VoiceOver, TalkBack, NVDA) ni en un teléfono físico. axe cubre estructura y contraste, no cómo se anuncia.

# Pantallas del conductor (Fase 3)

Reservar una cochera toma **cuatro pasos como máximo**: Recinto, Cochera, Horario y Pago. Antes del paso 3 hace falta una **cuenta verificada** (D-016). Para verlo: `npm run dev` en `frontend/` y abrir **/**. La API es simulada en el navegador (D-014), así que funciona sin backend.

## El flujo

| Paso         | Ruta                                           | Qué hace la persona                                                                                                                             |
| ------------ | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Recinto   | `/`                                            | Elige recinto y evento. Se prellena llegada 2 h antes y salida 1 h después                                                                      |
| 2. Cochera   | `/venues/:venueId/spaces` y `/spaces/:spaceId` | Mapa y lista con disponibilidad en vivo; abre el detalle (fotos, reseñas, medidas). **Abierto a todos**                                         |
| Cuenta       | `/account/new`                                 | Si continúa sin cuenta completa, el botón dice "Crear cuenta para continuar" y la lleva aquí. Al terminar vuelve al paso 3 con su mismo horario |
| 3. Horario   | `/book/:spaceId/time`                          | **Solo con cuenta verificada.** Ajusta llegada y salida, elige su auto (ya registrado, sin escribir la placa) y ve el precio exacto             |
| 4. Pago      | `/book/:spaceId/pay`                           | **Solo con cuenta verificada.** Revisa y paga. Aquí se crea la reserva                                                                          |
| Boleto       | `/bookings/:bookingId`                         | Boleto con código y dirección exacta; puede cancelar                                                                                            |
| Mis reservas | `/bookings`                                    | Lista de reservas                                                                                                                               |
| Perfil       | `/profile`                                     | Idioma, datos, estado de verificación y autos (agregar o quitar)                                                                                |

### La cuenta, en orden

1. **Teléfono** verificado con código (SMS o Google, simulados).
2. **Datos personales:** nombre legal, fecha de nacimiento (mayor de 18), correo y aceptación del aviso de privacidad.
3. **Auto:** placa, marca, modelo, color y tipo (compacto, sedán, SUV, pick-up).
4. **Identidad:** INE y selfie con un proveedor (simulado). La pantalla espera la respuesta del proveedor; si la rechaza, ofrece reintentar.

La cuenta se reanuda en lo primero que falte. **Quien intente abrir el paso 3 o 4 escribiendo la dirección también es enviado aquí**, y después regresa al mismo lugar (el destino solo puede ser una ruta de la propia app).

El viaje (recinto, horario y auto elegido) vive en la **URL**, así que el botón de atrás, recargar y compartir el enlace funcionan. No viaja ningún dato personal en ella: el auto va por su identificador, no por la placa.

## Reglas de dominio que el frontend respeta

- **Sin cuenta completa no hay reserva.** El servidor responde 403 (`profile_incomplete`, `vehicle_required`, `identity_required`) aunque se salten las pantallas.
- **El auto debe caber.** Cada cochera acepta ciertos tipos de auto. El detalle avisa si ninguno de tus autos cabe, el paso 3 marca los que no caben, y el servidor rechaza la reserva (422 `vehicle_not_supported`).
- **Sin doble reserva.** Si alguien reserva la cochera mientras la persona paga, el servidor responde 409 y la pantalla lo explica y ofrece elegir otra. La lista marca "No disponible" sola (consulta cada 15 s y al volver a la ventana; sin WebSockets).
- **Apartado de 10 minutos.** La reserva nace `pending_payment`. Si el pago falla, no se confirma ni se entrega código o dirección, y el lugar se libera al vencer.
- **Dirección exacta solo tras confirmar.** Antes se ve únicamente la zona.
- **Lo que ve el anfitrión** (diseño, se aplica en la Fase 4): nombre de pila, auto e insignia de identidad verificada; nunca teléfono, correo ni INE.
- **Dinero en centavos enteros y fechas en UTC.** El precio lo calcula el servidor; las fechas se muestran en hora de Ciudad de México.
- **Cancelación gratis hasta 10 minutos antes de la llegada.**
- **Cada conductor solo ve sus reservas y sus autos.**

## Contrato de la API

`backend/openapi.draft.yaml` es el contrato que el backend (Fase 5) deberá cumplir. Los tipos del cliente se generan con `npm run api:types`. Cubre recintos, eventos, búsqueda con disponibilidad, detalle, reseñas, cotización, reservas (crear, listar, ver, confirmar, cancelar) y cuenta (`/api/me`, `/api/me/profile`, `/api/me/vehicles`, `/api/me/identity`).

## API simulada

`frontend/src/mocks/` implementa esas reglas: `domain/db.ts` (reservas, disponibilidad, expiración, cancelación), `domain/accounts.ts` (datos personales, autos, identidad), `pricing.ts`, `geo.ts`, `seed.ts` y `handlers.ts` (MSW). Reservas, cuentas y sesión de demostración persisten en `localStorage`. La verificación de identidad se aprueba sola a los 3 segundos; en pruebas se puede forzar el rechazo.

Se activa con `VITE_USE_MOCK_API=true` y **no viaja en producción** (el código y el `mockServiceWorker.js` se eliminan de la compilación). Para pasar al backend real basta quitar la bandera y fijar `VITE_API_URL`.

## Capturas

`docs/driver/screenshots/` (móvil Pixel 7 y escritorio 1280; se regeneran con `SCREENSHOTS=1 npx playwright test driver-screenshots`):

| Pantalla                                                        | Archivos (`mobile-` y `desktop-`)                                                                                    |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| 1. Recinto y evento                                             | `1-venue`                                                                                                            |
| 2. Mapa y lista                                                 | `2-spaces`                                                                                                           |
| 2. Detalle                                                      | `3-detail`, `3b-detail-reviews`                                                                                      |
| Cuenta: teléfono, datos, auto, identidad, identidad en revisión | `4a-account-phone`, `4b-account-profile`, `4c-account-vehicle`, `4d-account-identity`, `4e-account-identity-pending` |
| 3. Horario                                                      | `5-time`                                                                                                             |
| 4. Pago                                                         | `6-pay`                                                                                                              |
| Boleto                                                          | `7-ticket`                                                                                                           |
| Mis reservas                                                    | `8-bookings`                                                                                                         |
| Perfil                                                          | `9-profile`                                                                                                          |

## Verificación automática

- **318 pruebas unitarias y de pantalla (Vitest, contando también las del anfitrión):** reglas de la API simulada (doble reserva, precios sin fracciones, expiración, privacidad de la dirección, cancelación, persistencia), **cuentas** (nombre, mayoría de edad, correo, consentimiento, autos, identidad pendiente, aprobada y rechazada, aislamiento entre cuentas), etapas de la cuenta y redirecciones seguras, guarda de pasos 3 y 4 (sin cuenta, a medias, identidad pendiente, verificada), registro completo, pago correcto, pago fallido que no confirma, cochera tomada por otra persona, auto que no cabe, y que **no falte ninguna traducción**.
- **77 pruebas de punta a punta (Playwright, móvil y escritorio, contando también las del anfitrión), con axe WCAG 2.1 AA en cada pantalla:** flujo completo desde cero (crear cuenta en el paso 2, reservar y cancelar), pasos 3 y 4 inaccesibles escribiendo la dirección, cuenta a medias, identidad rechazada con reintento, menor de edad y falta de consentimiento, auto que no cabe, conductor verificado que pasa directo, doble reserva mientras se paga, lista que marca "No disponible", persistencia tras recargar, inglés y 404.

## Defectos que encontró la revisión (ya corregidos)

- La barra con "Ver cocheras" quedaba **debajo** de la navegación inferior, que interceptaba los clics.
- Pines de cocheras cercanas montados sobre el marcador del recinto (escala lineal; ahora raíz cuadrada).
- Código de barras del boleto a un tercio del ancho; título largo cortado; encabezado desalineado en escritorio.
- Una lista de definición inválida que axe señaló.
- La API simulada viajaba en la compilación de producción.
- El aviso de "revisando identidad" no tenía fondo y parecía flotar.

## Límites conocidos

- **Verificación de identidad simulada.** No se pide ninguna imagen; el flujo real con Truora (INE y selfie) llega cuando se pida.
- **Falta la foto de perfil** y la página del aviso de privacidad (hoy es solo una casilla con el texto). **Hace falta revisión legal** antes de producción: INE y selfie son datos personales sensibles, y la ley mexicana de protección de datos cambió recientemente.
- **Reserva instantánea:** el anfitrión no aprueba cada reserva. Si se decide que sí, cambia el paso 4 y el apartado.
- **Mapa y fotos son ilustraciones**; pagos, SMS y Google son simulados. El código de prueba es `000000`.
- **Datos de ejemplo.** Los recintos usan los nombres de la spec con coordenadas aproximadas que hay que verificar. Los textos de cocheras y reseñas vienen de la API y no se traducen.
- **El selector de fecha es el nativo del navegador**, así que su formato depende del idioma del navegador.
- **Sin reseñas nuevas, notificaciones ni cobro de cancelación tardía.** Falta aplicar el idioma del perfil al iniciar sesión.
- **No probado con lector de pantalla real** ni en un teléfono físico. axe cubre estructura y contraste, no cómo se anuncia.

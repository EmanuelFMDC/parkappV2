# Decisiones vigentes

Estado actual del frontend de ParkApp. El contexto general y las reglas no negociables están en [`CLAUDE.md`](../CLAUDE.md).

## Stack del frontend

| Tema | Decisión |
|---|---|
| Base | React 19 + TypeScript 5.9 + Vite, como PWA. TypeScript fijado en 5.9 porque `openapi-typescript` exige `^5` |
| Datos | TanStack Query. Disponibilidad con polling de 15 s y refetch al volver a la ventana. Sin WebSockets |
| Rutas y estilos | React Router y Tailwind (tokens en `index.css`) |
| Paquetes | npm. Un solo paquete JavaScript en el monorepo |
| Cliente de API | `openapi-fetch` con tipos generados por `openapi-typescript` desde `docs/api/openapi.draft.yaml` (`npm run api:types`) |
| i18n | `react-i18next`, `es-MX` y `en`. Cualquier `es-*` se mapea a `es-MX`. Preferencia en `localStorage`. Los textos que vienen de la API (títulos, reseñas) no se traducen |
| Pruebas | Vitest y Playwright (usa el Chrome instalado, `channel: 'chrome'`; fija `es-MX` y `America/Mexico_City`). axe corre en ambos idiomas |
| Calidad | ESLint, Prettier y pre-commit. ESLint prohíbe `parseFloat` |
| CI | GitHub Actions: formato, lint, pruebas unitarias y build. Playwright aún no corre en CI |
| Servicios externos | Stripe, Truora, Firebase y Google Maps viven detrás de interfaces con implementación simulada hasta que se pidan |

## API

- **El contrato lo escribe el frontend:** `docs/api/openapi.draft.yaml`. La API real lo cumple o se ajusta de común acuerdo.
- **API simulada con MSW** en desarrollo y en las pruebas de punta a punta. Se activa con `VITE_USE_MOCK_API=true`. El código y el worker se eliminan de la compilación de producción.
- **Cambiar a la API real** es cambiar `VITE_API_URL` y quitar el modo simulado; las pantallas no se tocan.
- **Reglas que la simulación ya aplica y la API real debe respetar:** sin doble reserva (409), precios en centavos enteros, fechas en UTC, dirección exacta solo tras confirmar, permisos validados en el servidor.
- **El precio lo calcula el servidor** (`/quote`); el cliente nunca suma. `formatCents` y los mocks de pago lanzan error con decimales.

## Precios

Fuente: presentación final del proyecto (modelo de negocio).

- **ParkApp fija la tarifa, no el anfitrión.** Dentro de 3 km de un recinto se usa la tarifa por hora del recinto y se suman $50 una vez por reserva. Fuera de esa zona, la tarifa del municipio. Hoy toda cochera debe estar a 3 km de un recinto, así que la tarifa por municipio solo aplica si esa regla cambia.
- **Fórmula:** tarifa × horas + $50 (zona de recinto) + comisión del 15 % sobre esa suma + IVA del 16 % sobre la comisión. El conductor paga el total; el anfitrión recibe tarifa × horas + $50. Porcentajes en puntos base y redondeo a medio centavo hacia arriba, solo con enteros (`lib/tariffs.ts`).
- **Montos provisionales** en `lib/tariffs.ts` (Akron $60, Jalisco y Telmex $50, 3 de Marzo, Benito Juárez y Arena VFG $40; municipios de $15 en Tonalá a $30 en Zapopan). Los define el negocio antes de producción.
- **Reservas por horas completas** (bloques de 60 min). La API responde 422 `invalid_block` a cualquier otra duración. El horario por defecto se amplía a la hora completa en ambos extremos.
- **El desglose viaja en la API** (`PriceBreakdown`: renta, zona, subtotal, comisión, IVA, total) y el cliente solo lo muestra.
- **Supuestos a confirmar:** los $50 son por reserva y no por hora; el IVA se cobra solo sobre la comisión; los $50 son para el anfitrión.

## Design system

- **El ámbar es la acción, el azul es la marca.** Un botón de acción por pantalla.
- **Objeto memorable:** el boleto de evento (`TicketStub`), con talón perforado.
- **Layout por contenedor, no por ventana.** `MapListLayout` y `BottomSheet` usan container queries y `ResizeObserver` (acople a 768 px).
- **Contraste como prueba:** `styleguide/tokens.ts` refleja `index.css`; una prueba falla si difieren o si alguna de las 17 combinaciones baja de AA. Aro de foco azul (9,4:1) y token `control` (3,5:1) para bordes de campos.
- **Mapa y fotos son ilustraciones** hasta conectar Google Maps y Cloud Storage. El mapa usa escala de raíz cuadrada para no tapar el marcador del recinto.
- **Capturas** en `docs/design-system/screenshots/`, sin vistas de página completa por el límite de 500 KB del pre-commit.
- **Datos de ejemplo:** los recintos usan coordenadas aproximadas; verificarlas antes de producción. Recintos: Estadio Akron, Estadio Jalisco, Estadio 3 de Marzo, Auditorio Telmex, Auditorio Benito Juárez y Arena VFG.

## Modo conductor

- **Cuatro pasos:** Recinto, Cochera (lista y detalle), Horario, Pago. El inicio de sesión aparece dentro del pago, solo si hace falta.
- **El viaje vive en la URL** (recinto y horario). Horario por defecto: llegada 2 horas antes del evento y salida 1 hora después de que termina, redondeado a horas completas.
- **Paso 4, "Llegar":** la reserva confirmada trae el pin exacto (`space.location`, como la dirección, solo tras confirmar) y un botón "Cómo llegar" que abre la ruta en Google Maps en otra pestaña o en la app de mapas del teléfono. Es un enlace público sin clave ni SDK, detrás de `MapService.navigationUrl`; no cuenta como integrar Google Maps.
- **Llegada y salida (check-in / check-out):** la llegada se registra desde 30 minutos antes del inicio y hasta el fin; la salida, después de la llegada. En ambas el conductor sube de 2 a 4 fotos del auto y del cajón (respaldo ante daños; `lib/arrival.ts`). La reserva pasa a `in_use` y luego a `completed`, y sigue bloqueando el cajón mientras está en uso.
- **Hora extra:** salir más de 10 minutos después del fin cobra cada hora iniciada a la tarifa por hora + 15 % de comisión + IVA sobre la comisión, sin el cargo de zona. Se carga a la tarjeta de la reserva al registrar la salida (en producción, Stripe fuera de sesión). El anfitrión ve la hora de llegada, de salida y las horas extra.
- **Supuestos a confirmar:** 2 a 4 fotos, 30 minutos de anticipación para llegar y 10 de tolerancia para salir. Qué pasa si un conductor nunca registra la salida, o si su hora extra choca con la siguiente reserva, queda para el backend.
- **La reserva se crea al pagar.** Nace `pending_payment` con apartado de 10 minutos y se confirma solo si el pago tuvo éxito. Dirección exacta y código solo tras confirmar.
- **Cuenta verificada antes del paso 3.** El paso 2 es abierto; el 3 y el 4 exigen cuenta completa y verificada, y el servidor también lo exige (403). Quien continúa sin ella va a `/account/new` y vuelve al mismo horario.
- **Cuenta en cuatro etapas:** teléfono, datos personales (nombre legal, fecha de nacimiento, mayoría de edad, correo, aviso de privacidad), auto (placa, marca, modelo, color, tipo) e identidad (INE y selfie, simulada).
- **La placa sale del auto registrado**, no se pide en el paso 3. El tipo de auto debe caber en la cochera (422 `vehicle_not_supported`).
- **Supuestos fáciles de cambiar:** reserva instantánea sin aprobación del anfitrión; foto de perfil para después.
- **Cancelación:** gratis hasta 2 horas antes del inicio (`freeCancelUntil`). Después y hasta el inicio, ParkApp retiene el 20 % del total (`lateCancelFeeCents`, lo calcula el servidor) y devuelve el resto. Ya empezada no se puede cancelar (409 `already_started`). Un apartado sin pagar se suelta sin cobro. La reserva cancelada guarda quién canceló, la penalización y el reembolso.
- **Diferido:** reseñas nuevas, notificaciones, reembolsos reales con Stripe y aplicar el idioma del perfil al iniciar sesión.

## Modo anfitrión

- **Alta en cuatro pasos:** ubicación, dimensiones, fotos, precio (solo muestra lo que gana; ver Precios). Más "Mis cocheras" (pausar, reactivar) y "Reservas recibidas".
- **Identidad:** mismo registro que el conductor, sin pedir auto. Sin identidad verificada no se puede publicar.
- **Ubicación:** dirección escrita más pin en el mapa ilustrado, con botones de dirección para teclado y lector de pantalla. Sin geocodificación hasta Google Maps.
- **Revisión antes de publicar.** Una cochera nueva nace `pending_review`; el back-office la aprueba o rechaza con un motivo. Solo las `active` aparecen en las búsquedas.
- **Un anfitrión no puede reservar su propia cochera** (422 `own_space`).
- **Qué ve el anfitrión de un conductor:** nombre de pila, insignia, auto y precio; nunca teléfono, correo ni INE.
- **Autos sugeridos por medidas** con umbrales orientativos y editables (`lib/hostRules.ts`); validar con un anfitrión real.
- **Precio:** lo fija ParkApp por zona. El anfitrión ve "Ganas $X por hora" y, en cada reserva recibida, lo que gana (renta + $50 de zona).
- **Una cochera sin reseñas dice "Nueva"** en vez de 0.0. Pausar no cancela reservas confirmadas.
- **El borrador del alta vive en `sessionStorage`** y no sale del navegador hasta publicar.
- **El anfitrión puede cancelar** una reserva confirmada que no ha empezado; el conductor recibe el 100 %. El aviso advierte que cancelar seguido puede suspender la cuenta (la regla de suspensión aún no existe).
- **Diferido:** editar otros datos de una cochera publicada, eliminarla, pagos al anfitrión (Stripe Connect), si el anfitrión recibe parte de la penalización por cancelación tardía, reseñas a conductores y mensajería.

## Una sola app, dos modos

- **Una cuenta, dos modos.** Un solo código (Capacitor) y una identidad verificada por persona.
- **Cada modo tiene su barra:** conductor = Explorar, Mis reservas, Perfil; anfitrión = Mis cocheras, Reservas, Perfil. En modo anfitrión una franja oscura "Modo anfitrión" con botón para volver.
- **El modo lo decide la dirección** (`/host...`), sin estado oculto. El Perfil existe en ambos (`/profile` y `/host/profile`); en modo anfitrión no muestra autos.
- **Puntos de entrada:** tarjeta "Modo anfitrión" en el Perfil e invitación discreta en Explorar. Se puede mirar el modo anfitrión sin cuenta; se pide al empezar a publicar.
- **La app recuerda el último modo** (`localStorage`). Solo se restaura el modo anfitrión, al abrir en `/` sin parámetros, una vez por pestaña (`sessionStorage`) y si la cuenta de anfitrión está lista. Nunca se redirige por un enlace, una recarga o al elegir conductor. Cerrar sesión lo olvida. Sin almacenamiento, abre en conductor.

## Backend


## Pendientes

- **Legal:** aviso de privacidad, consentimiento para INE y selfie, y reglas para anfitriones son textos provisionales; los debe revisar un abogado. Las imágenes de identidad deben quedarse con el proveedor.
- Verificar condiciones vigentes de Stripe Connect para México antes de implementar pagos.
- Verificar la región `northamerica-south1` en Cloud Run.

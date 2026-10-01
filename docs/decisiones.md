# Registro de decisiones

Formato: una entrada por decisión. Las que vienen de `CLAUDE.md` están marcadas como **dadas**; no se reabren sin pedirlo.

## D-001 · Monolito modular (dada)

Django 5 + Django Ninja, apps `users`, `spaces`, `search`, `bookings`, `payments`, `reviews`. Sin microservicios, Kubernetes ni Redis hasta medir un cuello de botella.

## D-002 · Doble reserva imposible en la base de datos (dada)

`EXCLUDE USING gist (space_id WITH =, tstzrange(inicio, fin) WITH &&)`. Se prueba con dos reservas solapadas.

## D-003 · Dinero en centavos, fechas en UTC (dada)

`BigIntegerField` para montos. UTC en backend y base de datos; conversión a `America/Mexico_City` solo en el cliente.

## D-004 · Disponibilidad por polling, sin WebSockets (dada)

Polling corto con TanStack Query.

## D-005 · Servicios externos detrás de interfaces mock (dada)

Stripe, Truora, Firebase y Google Maps no se instalan ni configuran hasta que se pida. Cada uno vive detrás de una interfaz con implementación simulada.

## D-006 · Plugins de Claude Code

- frontend-design, Design y Superpowers exponen skills y se usan desde la sesión.
- Security Guidance **no expone skills**: trabaja solo con hooks (avisos por patrones al editar, revisión del diff al terminar cada turno, revisión de commits). Que no aparezca en la lista de skills es normal. Su capa agéntica requiere `claude_agent_sdk` en `~/.claude/security/agent-sdk-venv`, que no se instaló en el arranque por la lentitud de la conexión.

## D-007 · Prototipo previo del frontend

Antes de esta especificación se construyó un prototipo de estacionamientos genéricos (7 pantallas del conductor, design system, auditoría de accesibilidad). No encaja con el dominio P2P ni con el orden de trabajo. Se conserva en el tag `prototype-v1` y el frontend se rehace según el plan por fases. De ahí se reutilizan solo ideas ya validadas (tokens de contraste, `TicketStub`, patrones de accesibilidad), no el código tal cual.

## D-008 · Orden de fases: el backend va antes de las pantallas (2026-09-30) — REEMPLAZADA por D-014

Fase 0 (base del monorepo) → Fase 1 (cimientos del frontend) → Fase 2 (design system, con parada para aprobación) → Fase 5 (backend) → Fase 3 (conductor) → Fase 4 (anfitrión) → Fase 6 (integración y despliegue).
**Por qué:** el contrato OpenAPI sale del modelo real (restricción de doble reserva, permisos, campos exactos) y el frontend genera sus tipos con `openapi-typescript` sin inventar un contrato a mano que luego haya que corregir.

## D-009 · Gestor de paquetes del frontend: npm (2026-09-30)

Un solo paquete JavaScript en el monorepo, así que las ventajas de pnpm no compensan. Migrar después es sencillo si aparecen varios paquetes JS.

## D-010 · Python 3.12 para el backend (2026-09-30)

## D-011 · Documentos del prototipo archivados (2026-09-30)

`docs/accessibility-audit.md` y `docs/components.md` describen el prototipo y pasan a `docs/prototipo-v1/`. Se rehacen al terminar la Fase 2.

## D-012 · Fase 1: cimientos del frontend (2026-09-30)

- **TypeScript fijado en 5.9.** `openapi-typescript` exige `typescript@^5`; la 6.0 que trae Vite rompía la instalación y forzarla arriesgaba la generación de tipos.
- **Cliente de API:** `openapi-fetch`, la librería compañera de `openapi-typescript`, para tener llamadas tipadas desde el contrato.
- **Contrato provisional:** `backend/openapi.bootstrap.yaml` solo define `/api/health` para probar la cadena de generación de tipos. Se elimina en la Fase 5, cuando el contrato se exporta desde Django Ninja (D-008).
- **MSW solo en pruebas.** No hay worker en el navegador porque el backend llega antes de las pantallas.
- **Playwright usa el Chrome ya instalado** (`channel: 'chrome'`), sin descargar navegadores. Las pruebas fijan `es-MX` y `America/Mexico_City`; una prueba aparte cubre navegador en inglés.
- **Idiomas:** `es-MX` y `en`. Cualquier locale `es-*` se mapea a `es-MX`; el resto, a `es-MX` salvo `en-*`. Preferencia en `localStorage` por ahora; se sincroniza con el perfil cuando exista el backend.
- **Guardas en código:** `formatCents` y los mocks de pago lanzan error con decimales; ESLint prohíbe `parseFloat`.
- **Pendiente en CI:** el job del frontend ejecuta formato, lint, pruebas unitarias y build. Playwright aún no corre en CI (no verificado en un runner).

## D-013 · Fase 2: design system (2026-09-30)

- **El ámbar es la acción, el azul es la marca.** Cambia respecto al prototipo, donde el botón principal era azul. Sigue la spec: "azul profundo de marca con acento cálido para acciones". Hay un botón de acción por pantalla.
- **Objeto memorable: el boleto de evento** (`TicketStub`), con talón perforado. Cada mitad recorta sus propias esquinas para que las muescas coincidan con la línea de corte.
- **Layout por contenedor, no por ventana.** `MapListLayout` y `BottomSheet` usan container queries y un `ResizeObserver` sobre su contenedor (acople a 768 px). Así el mismo componente se demuestra en marcos de teléfono y escritorio dentro de una sola página, y funcionará igual dentro de una pantalla real.
- **Contraste como prueba, no como intención.** `styleguide/tokens.ts` refleja `index.css` y una prueba falla si difieren o si alguna de las 17 combinaciones baja de AA. axe corre en Playwright en ambos idiomas.
- **Corrección de tokens del prototipo:** el aro de foco pasó de ámbar (1,7:1) a azul (9,4:1) y se creó `control` (3,5:1) para bordes de campos.
- **Mapa y fotos son ilustraciones** hasta conectar Google Maps y Cloud Storage detrás de sus interfaces.
- **Capturas** en `docs/design-system/screenshots/`. Se omiten las vistas de página completa porque pesan hasta 2,2 MB y superan el límite de 500 KB del hook de pre-commit.

## D-014 · Primero se termina el frontend; el backend queda para después (2026-09-30)

Decisión del dueño del proyecto tras aprobar el design system. Orden nuevo: Fase 3 (conductor) → Fase 4 (anfitrión) → Fase 5 (backend) → Fase 6 (integración y despliegue).

- **El contrato lo escribe el frontend.** Sin backend que lo exporte, `backend/openapi.draft.yaml` es el borrador que Django Ninja deberá cumplir (o ajustar con acuerdo). Los tipos del cliente se generan de ese archivo.
- **API simulada en el navegador con MSW**, ahora también en desarrollo y en las pruebas de punta a punta, no solo en pruebas unitarias. La base en memoria implementa las reglas del dominio: sin doble reserva (responde 409), precios en centavos enteros, fechas en UTC, dirección exacta solo tras confirmar.
- **Cambiar al backend real será cambiar `VITE_API_URL`** y quitar el modo simulado; las pantallas no se tocan.
- **Riesgo asumido:** un contrato escrito sin modelo real puede necesitar ajustes cuando exista el backend. Se mitiga manteniéndolo pequeño y revisándolo al empezar la Fase 5.
- **Docker ya no es necesario por ahora.**
- **Datos de ejemplo:** los recintos usan los nombres de la spec con coordenadas aproximadas; hay que verificarlas antes de producción.

## D-015 · Fase 3: pantallas del conductor (2026-09-30)

- **Cuatro pasos:** Recinto, Cochera (lista y detalle), Horario, Pago. El inicio de sesión no es un paso aparte: aparece dentro del pago, solo si hace falta.
- **El viaje vive en la URL** (recinto y horario) y la placa en `sessionStorage`, nunca en la URL, para no exponer datos personales en enlaces.
- **Horario por defecto:** llegada 2 horas antes del evento y salida 1 hora después de que termina. Editable en el paso 3.
- **La reserva se crea al pagar.** Nace `pending_payment` con apartado de 10 minutos; se confirma solo si el pago tuvo éxito. Dirección exacta y código solo tras confirmar.
- **Disponibilidad con polling de 15 s** más refetch al volver a la ventana. Sin WebSockets.
- **El precio lo calcula el servidor** (`/quote`); el cliente nunca suma.
- **La API simulada se elimina de producción** (código y worker), no solo se apaga con una bandera.
- **Mapa con escala de raíz cuadrada:** la mayoría de las cocheras están a menos de 1 km y con escala lineal tapaban el marcador del recinto.
- **Los textos que vienen de la API** (títulos de cocheras, reseñas) no se traducen: son contenido de los anfitriones.
- **Diferido:** reseñas nuevas, notificaciones, cobro por cancelación tardía y aplicar el idioma del perfil al iniciar sesión.

## D-016 · Cuenta verificada antes del paso 3 (2026-09-30)

Decisión del dueño del proyecto: el conductor debe registrarse de forma rigurosa, igual que un anfitrión, porque el anfitrión entrega un espacio privado a un desconocido y necesita confianza (modelo Airbnb).

- **El paso 2 sigue abierto**; el paso 3 y el 4 exigen cuenta completa y verificada. Quien continúa sin ella va a `/account/new` y vuelve al mismo horario al terminar. El servidor también lo exige (403), no solo la interfaz.
- **La placa ya no se pide en el paso 3:** sale del auto registrado. Se elige uno si hay varios.
- **Cuenta en cuatro etapas:** teléfono, datos personales (nombre legal, fecha de nacimiento, mayoría de edad, correo, aviso de privacidad), auto (placa, marca, modelo, color, tipo) e identidad (INE y selfie, simulada).
- **Regla nueva:** el tipo de auto debe caber en la cochera (422 `vehicle_not_supported`).
- **Cambia `CLAUDE.md`:** la fila "Identidad" pasa de "solo anfitriones" a "anfitriones y conductores". La verificación **real** sigue fuera de alcance (D-005).
- **Supuestos tomados al no recibir respuesta, fáciles de cambiar:** (1) la identidad va dentro del registro, antes del paso 3; (2) reserva instantánea, sin aprobación del anfitrión; (3) la foto de perfil queda para después.
- **Lo que ve el anfitrión:** nombre de pila, auto e insignia de verificado; nunca teléfono, correo ni INE.
- **Contrato:** `/api/me` crece (datos, autos, estado de identidad) y se añaden `/api/me/profile`, `/api/me/vehicles` y `/api/me/identity`; `BookingCreate` usa `vehicleId` en lugar de la placa. El proveedor responde de forma asíncrona (webhook en producción): el cliente consulta `/api/me` hasta que sea `verified` o `rejected`.
- **Legal (pendiente):** INE y selfie son datos personales sensibles. Hace falta aviso de privacidad y consentimiento revisados por un abogado, y que las imágenes se queden con el proveedor y ParkApp guarde solo el resultado.

## D-017 · Fase 4: pantallas del anfitrión (2026-10-01)

Las tres preguntas de alcance quedaron sin respuesta, así que se tomaron estos supuestos (fáciles de cambiar):

1. **La identidad del anfitrión usa el mismo registro** que la del conductor, sin pedir auto: teléfono, datos personales e identidad. Sin identidad verificada no se puede publicar.
2. **Alcance:** alta en cuatro pasos, "Mis cocheras" (pausar, reactivar, cambiar precio) y "Reservas recibidas".
3. **Ubicación:** dirección escrita más pin en el mapa ilustrado, con botones de dirección para teclado y lector de pantalla. Sin geocodificación hasta Google Maps.

Decisiones tomadas:

- **Revisión antes de publicar.** Una cochera nueva nace `pending_review`; el back-office (Django Admin, simulado) la aprueba o la rechaza con un motivo. Solo las `active` aparecen en las búsquedas. Sigue la spec ("revisar fotos", "aprobar anfitriones").
- **Un anfitrión no puede reservar su propia cochera** (422 `own_space`).
- **Qué ve el anfitrión de un conductor:** nombre de pila, insignia, auto y precio; nunca teléfono, correo ni INE. Una prueba lo verifica sobre la respuesta real.
- **Autos sugeridos por medidas** con umbrales orientativos y editables; la regla vive en `lib/hostRules.ts` y debe validarse con un anfitrión real.
- **Precio:** entero en centavos, $20 a $500 por hora. La comisión del anfitrión no se define aquí: el panel muestra el precio de la reserva antes del cargo por servicio, sin inventar un pago neto.
- **Una cochera sin reseñas dice "Nueva"** en vez de 0.0.
- **Pausar no cancela reservas ya confirmadas.**
- **El borrador del alta vive en `sessionStorage`** y no sale del navegador hasta publicar.
- **Contrato:** `/api/host/spaces`, `/api/host/spaces/{id}` y `/api/host/bookings`; la verificación de identidad deja de exigir un auto.
- **Pendiente legal:** las "reglas para anfitriones" y el aviso de privacidad son textos provisionales que debe revisar un abogado.
- **Diferido:** editar otros datos de una cochera publicada, eliminarla, pagos al anfitrión (Stripe Connect), cancelaciones del anfitrión, reseñas a conductores y mensajería.

## D-018 · Modo conductor y modo anfitrión en una sola app (2026-10-01)

Decisión del dueño del proyecto tras revisar el frontend: separar el flujo del anfitrión del del conductor, sin separar la app ni la cuenta.

- **Una cuenta, dos modos** (como Airbnb). Se descartaron dos apps o dos cuentas: la spec pide un solo código (Capacitor) y una identidad verificada por persona, y muchos anfitriones también van a eventos.
- **Cada modo tiene su barra:** conductor = Explorar, Mis reservas, Perfil; anfitrión = Mis cocheras, Reservas, Perfil. "Reservas recibidas" pasa de ser un selector escondido dentro de una pestaña a una pestaña propia.
- **El modo lo decide la dirección** (`/host...`), sin estado oculto ni redirecciones al abrir la app. Ventaja: enlaces, recarga y botón de atrás siempre coinciden con la pantalla. Costo: la app no recuerda el último modo usado; se puede añadir si hace falta.
- **Señal visual:** en modo anfitrión una franja oscura "Modo anfitrión" con el botón para volver, en todas las pantallas con barra. No se repite el mismo botón en el Perfil.
- **Puntos de entrada:** tarjeta "Modo anfitrión" en el Perfil e invitación discreta en Explorar. Se puede mirar el modo anfitrión sin cuenta; se pide al empezar a publicar.
- **El Perfil existe en ambos modos** (`/profile` y `/host/profile`); en modo anfitrión no muestra autos.
- **Sin cambios de contrato ni de API.** Los enlaces viejos `/host?tab=bookings` redirigen a `/host/bookings`.

## Pendientes de decidir

- Verificar condiciones vigentes de Stripe Connect para México antes de implementar pagos.
- Verificar disponibilidad de la región `northamerica-south1` en Cloud Run y Cloud SQL.

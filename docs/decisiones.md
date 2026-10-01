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

## D-008 · Orden de fases: el backend va antes de las pantallas (2026-09-30)
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

## Pendientes de decidir
- Verificar condiciones vigentes de Stripe Connect para México antes de implementar pagos.
- Verificar disponibilidad de la región `northamerica-south1` en Cloud Run y Cloud SQL.

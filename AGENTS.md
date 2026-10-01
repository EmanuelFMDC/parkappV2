# Contexto: ParkApp

Plataforma P2P para rentar cocheras y cajones privados por horas cerca de recintos de eventos masivos en la Zona Metropolitana de Guadalajara (Estadio Akron, Estadio Jalisco, Auditorio Telmex, Auditorio Benito Juárez, Arena VFG). Radio de operación: hasta 3 km por recinto. Dos roles: conductor (reserva) y anfitrión (publica el cajón). El conductor debe poder reservar en un máximo de 4 pasos. El anfitrión da de alta su espacio en un flujo secuencial: ubicación, dimensiones, fotos, precio.

## Tarea inicial
1. Guarda esta especificación como `AGENTS.md` en la raíz del repo, para que sea el contexto fijo de todas las sesiones.
2. Crea un monorepo con `/backend`, `/frontend`, `/infra` y `docs/decisiones.md`.
3. No instales ni configures servicios externos (Stripe, Truora, Firebase, Google Maps) todavía. Déjalos detrás de interfaces con implementación simulada (mock) hasta que yo lo pida.
4. Antes de escribir código, muéstrame el plan por fases y espera mi confirmación.

## Stack

| Capa | Tecnología | Nota |
|---|---|---|
| Backend | Django 5 + Django Ninja | Monolito modular con apps: `users`, `spaces`, `search`, `bookings`, `payments`, `reviews` |
| Geoespacial | GeoDjango + PostGIS | Búsqueda por radio de 3 km con `ST_DWithin` e índice espacial |
| Base de datos | PostgreSQL 16 + PostGIS en Cloud SQL | La restricción `EXCLUDE USING gist` con `tstzrange` bloquea la doble reserva |
| Back-office | Django Admin | Aprobar anfitriones, revisar fotos, resolver disputas |
| Tareas asíncronas | Cloud Tasks + Cloud Scheduler | Expiración de pre-reservas, recordatorios, liquidaciones. Sin Redis ni Celery en el MVP |
| Frontend | React 19 + TypeScript + Vite, como PWA | TanStack Query, React Router, Tailwind |
| Mapas | Google Maps Platform | Geocoding, Places, Maps JS, navegación al cajón |
| App móvil | Capacitor | Un solo código para iOS y Android. Plugins de geolocalización y push |
| Contrato API | OpenAPI → cliente TS con `openapi-typescript` | Tipos compartidos sin escribirlos a mano |
| Auth | Firebase Auth (teléfono + Google) → JWT verificado en Django | |
| Pagos | Stripe Connect | Comisión + pago al anfitrión. Verificar condiciones vigentes para México antes de implementar |
| Identidad | Truora (INE) | Solo anfitriones al inicio |
| Archivos | Cloud Storage + URLs firmadas | Fotos de cajones |
| Push | Firebase Cloud Messaging | Vía Capacitor |
| Infra | Docker + Cloud Run + Artifact Registry | Región `northamerica-south1` si está disponible. `min-instances=1` en producción |
| CI/CD | GitHub Actions | Rama `develop` → merge a `main` → build y deploy |
| Observabilidad | Sentry + Cloud Logging | Front y back |
| Pruebas | pytest-django, Vitest, Playwright | Playwright cubre el flujo de reserva de 4 pasos de punta a punta |
| Calidad | ruff, mypy (django-stubs), ESLint, Prettier, pre-commit | |

## Entornos
- Development: local. Testing: Docker Compose con Postgres/PostGIS aislado. Production: Cloud Run.

## Reglas de implementación (no negociables)
- **Doble reserva:** debe ser imposible a nivel de base de datos con `EXCLUDE USING gist (space_id WITH =, tstzrange(inicio, fin) WITH &&)`. Incluye una prueba que lo demuestre con dos reservas solapadas.
- **Dinero:** enteros en centavos (`BigIntegerField`). Nunca `float`.
- **Fechas:** todo en UTC en backend y base de datos. Convertir a `America/Mexico_City` solo en el cliente.
- **Disponibilidad "en tiempo real":** polling corto con TanStack Query. No usar WebSockets.
- **i18n:** español (México) e inglés con `react-i18next` en frontend e i18n de Django en backend. Idioma por defecto según navegador o teléfono, con preferencia guardada en el perfil. Cero textos fijos en componentes.
- **Seguridad:** ningún secreto en el repo. Variables de entorno y Secret Manager. Validar en el servidor toda entrada y todo permiso (un anfitrión solo edita sus espacios; un conductor solo ve sus reservas).
- **Arquitectura:** monolito modular. No microservicios, no Kubernetes, no Redis hasta medir un cuello de botella real.
- **Archivos pequeños y módulos acotados** para mantener bajo el consumo de tokens.

## Diseño
- Tono: confiable y cálido. Azul profundo de marca con acento cálido para acciones.
- Referencias: Airbnb (tarjetas con foto grande, mapa + lista sincronizados, reseñas visibles) y Uber (mapa a pantalla completa, panel inferior deslizable, contraste alto, pocos pasos). No copiar su identidad de marca.
- Mobile-first. Contraste de texto WCAG AA y objetivos táctiles de mínimo 44 px.
- Orden de trabajo: design system (tokens en Tailwind) → componentes base → pantallas del conductor → pantallas del anfitrión.
- Antes de construir pantallas, muéstrame el design system en una página de muestra con capturas en móvil y escritorio.

## Plugins
Los plugins frontend-design, Design, Security Guidance y Superpowers están instalados en mi Codex local. Si no los ves cargados en esta sesión, dímelo antes de seguir y no finjas usarlos.

## Fuera de alcance por ahora
App nativa (React Native/Flutter), Redis, WebSockets, microservicios, pagos reales, verificación de identidad real.

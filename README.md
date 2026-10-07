# ParkApp

Plataforma P2P para rentar cocheras y cajones privados por horas cerca de recintos de eventos masivos en la Zona Metropolitana de Guadalajara. Dos roles: conductor (reserva en máximo 4 pasos) y anfitrión (publica su espacio).

El contexto completo del proyecto, el stack y las reglas no negociables están en [`CLAUDE.md`](CLAUDE.md). Las decisiones se registran en [`docs/decisiones.md`](docs/decisiones.md).

## Estructura

| Carpeta | Contenido |
|---|---|
| `backend/` |  |
| `frontend/` | React 19 + TypeScript + Vite, PWA |
| `infra/` | Despliegue (Cloud Run) cuando llegue la Fase 6 |
| `docs/` | Decisiones, contrato API borrador (`docs/api/`) y documentación. `docs/prototipo-v1/` archiva el prototipo anterior |

## Ramas

Se trabaja en `develop`; el merge a `main` dispara build y deploy.


# ParkApp

Plataforma P2P para rentar cocheras y cajones privados por horas cerca de recintos de eventos masivos en la Zona Metropolitana de Guadalajara. Dos roles: conductor (reserva en máximo 4 pasos) y anfitrión (publica su espacio).

El contexto completo del proyecto, el stack y las reglas no negociables están en [`CLAUDE.md`](CLAUDE.md). Las decisiones se registran en [`docs/decisiones.md`](docs/decisiones.md).

## Estructura

| Carpeta | Contenido |
|---|---|
| `backend/` | Django 5 + Django Ninja + GeoDjango (Fase 5) |
| `frontend/` | React 19 + TypeScript + Vite, PWA |
| `infra/` | Docker Compose local, Dockerfiles y despliegue en Cloud Run |
| `docs/` | Decisiones y documentación. `docs/prototipo-v1/` archiva el prototipo anterior |

## Base de datos local

```bash
cp .env.example .env          # edita POSTGRES_PASSWORD
docker compose --env-file .env -f infra/docker-compose.yml up -d db       # desarrollo
docker compose --env-file .env -f infra/docker-compose.yml up -d db_test  # pruebas (en memoria)
```

## Ramas

Se trabaja en `develop`; el merge a `main` dispara build y deploy (a partir de la Fase 6).

## Prototipo anterior

El primer prototipo del frontend (estacionamientos genéricos) está en el tag `prototype-v1`.

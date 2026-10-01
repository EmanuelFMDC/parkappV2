# ParkApp · frontend

React 19 + TypeScript (estricto) + Vite + Tailwind v4, como PWA. Gestor de paquetes: **npm**.

## Comandos

| Comando                                       | Qué hace                                                       |
| --------------------------------------------- | -------------------------------------------------------------- |
| `npm run dev`                                 | Servidor de desarrollo                                         |
| `npm run build`                               | Typecheck + build de producción (genera el service worker)     |
| `npm run typecheck` / `lint` / `format:check` | Calidad                                                        |
| `npm test`                                    | Pruebas unitarias y de componentes (Vitest + MSW)              |
| `npm run test:e2e`                            | Pruebas de punta a punta (Playwright, usa el Chrome instalado) |
| `npm run api:types`                           | Regenera `src/api/schema.d.ts` desde el contrato OpenAPI       |

## Estructura

```
src/
  api/        cliente tipado (openapi-fetch) y tipos generados; polling de disponibilidad
  app/        proveedores (Query, API, servicios)
  i18n/       es-MX.json, en.json; cero textos fijos en componentes
  lib/        dinero en centavos (money.ts) y fechas UTC <-> Mexico City (time.ts)
  services/   interfaces de proveedores externos + implementaciones mock
  mocks/      handlers de MSW (solo pruebas)
  pages/      pantallas
e2e/          pruebas Playwright
```

## Reglas que el código hace cumplir

- El dinero son enteros en centavos: `formatCents` y los pagos lanzan error con decimales, y ESLint prohíbe `parseFloat`.
- Las fechas viajan en UTC; solo se convierten a `America/Mexico_City` al mostrarlas o capturarlas.
- Stripe, Truora, Firebase, Google Maps, Cloud Storage y FCM se usan únicamente a través de `src/services/` (hoy, mocks).
- La disponibilidad "en tiempo real" es polling con TanStack Query (`AVAILABILITY_POLL_MS`), sin WebSockets.

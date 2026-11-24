/**
 * Records a narrated walkthrough of ParkApp (driver and host) against the in-browser mock API.
 *
 *   npm run build:e2e
 *   npx vite preview --port 4173 --strictPort      (in another terminal)
 *   node scripts/demo/record.mjs                    (writes scripts/demo/out/raw/*.webm)
 *
 * The app runs inside a phone frame (frame.html, copied into dist/) and the explanation sits next
 * to it. Times are compressed with Playwright's clock so arrival, overtime and reports can be shown.
 */
import { chromium } from '@playwright/test'
import { copyFileSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const BASE = 'http://localhost:4173'
const OUT = resolve(here, 'out', 'raw')
const H = 3_600_000
const DRY = process.argv.includes('--dry') // no video, short pauses: to check the script runs

copyFileSync(resolve(here, 'frame.html'), resolve(here, '../../dist/demo-frame.html'))
rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ channel: 'chrome' })
const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  locale: 'es-MX',
  timezoneId: 'America/Mexico_City',
  ...(DRY ? {} : { recordVideo: { dir: OUT, size: { width: 1920, height: 1080 } } }),
})

// A visible tap inside the app, since the recording shows no mouse.
await context.addInitScript(() => {
  if (window.top === window) return
  addEventListener(
    'pointerdown',
    (e) => {
      const dot = document.createElement('div')
      dot.style.cssText = `position:fixed;left:${e.clientX - 22}px;top:${e.clientY - 22}px;width:44px;height:44px;border-radius:50%;background:rgba(255,178,26,.55);border:3px solid #f29d00;pointer-events:none;z-index:2147483647;transition:transform .5s ease-out,opacity .5s ease-out`
      document.body.appendChild(dot)
      requestAnimationFrame(() => {
        dot.style.transform = 'scale(1.8)'
        dot.style.opacity = '0'
      })
      setTimeout(() => dot.remove(), 600)
    },
    true,
  )
})

await context.clock.install({ time: new Date() })
const page = await context.newPage()
await page.goto(`${BASE}/demo-frame.html`)

const app = page.frameLocator('#app')
const frame = () => page.frame({ name: 'app' })
const pause = (ms) => page.waitForTimeout(DRY ? Math.min(ms, 150) : ms)
/** Reading time for a caption: about 15 characters per second, between 3 and 11 seconds. */
const readMs = (html) =>
  Math.max(3000, Math.min(11_000, 1200 + html.replace(/<[^>]+>/g, '').length * 65))

let shown = 0
const TOTAL = 30
async function say(chip, title, html, extraMs = 0) {
  shown += 1
  await page.evaluate(
    ([c, t, h, p]) => (window.say(c, t, h), window.progress(p)),
    [chip, title, html, shown / TOTAL],
  )
  await pause(readMs(html) + extraMs)
}
async function card(kicker, title, text, items = [], ms = 0) {
  await page.evaluate(([k, t, x, i]) => window.card(k, t, x, i), [kicker, title, text, items])
  await pause(ms || readMs(text + items.join(' ')))
  await page.evaluate(() => window.hideCard())
}
async function open(path) {
  await page.evaluate((src) => (document.getElementById('app').src = src), path)
  await page.waitForTimeout(300)
  await frame().waitForLoadState('load')
  await frame().waitForFunction(() => Boolean(window.__mockDb))
  await app.locator('h1').first().waitFor()
}
const tap = async (locator) => {
  await locator.scrollIntoViewIfNeeded()
  await pause(350)
  await locator.click()
  await pause(500)
}
const type = async (locator, text) => {
  await locator.scrollIntoViewIfNeeded()
  await locator.click()
  await locator.pressSequentially(text, { delay: DRY ? 0 : 45 })
}
const scrollApp = async (dy) => {
  await frame().evaluate((y) => window.scrollBy({ top: y, behavior: 'smooth' }), dy)
  await pause(900)
}
const heading = (text) => app.getByRole('heading', { level: 1, name: text })
const db = (fn, arg) => frame().evaluate(fn, arg)

/** Simple illustrated photos for the uploads, drawn in the browser (no files needed). */
async function photos(labels) {
  const urls = await page.evaluate((ls) => {
    const colors = ['#2a5cb8', '#0f6e40', '#8a5600', '#174a9f']
    return ls.map((label, i) => {
      const c = document.createElement('canvas')
      c.width = 800
      c.height = 600
      const g = c.getContext('2d')
      g.fillStyle = colors[i % colors.length]
      g.fillRect(0, 0, 800, 600)
      g.fillStyle = 'rgba(255,255,255,.18)'
      for (let x = -600; x < 800; x += 90) g.fillRect(x + i * 20, 380, 50, 220)
      g.fillStyle = '#ffffff'
      g.font = 'bold 64px Segoe UI'
      g.fillText(label, 50, 120)
      return c.toDataURL('image/png')
    })
  }, labels)
  return urls.map((u, i) => ({
    name: `${labels[i].toLowerCase().replace(/\s+/g, '-')}.png`,
    mimeType: 'image/png',
    buffer: Buffer.from(u.split(',')[1], 'base64'),
  }))
}

// ───────────────────────────── Opening ─────────────────────────────
await card(
  'Plataforma P2P · Zona Metropolitana de Guadalajara',
  'ParkApp',
  'Renta cocheras y cajones privados por horas, cerca de los estadios y auditorios, los días de evento.',
  [
    'Conductor: reserva en <b>4 pasos</b>',
    'Anfitrión: publica su cajón en <b>4 pasos y 14 campos</b>',
    'Precio fijado por zona, con comisión e IVA',
    'Llegada y salida con fotos, cancelación e incidencias',
  ],
  9000,
)

// ───────────────────────────── Driver ─────────────────────────────
await card(
  'Parte 1',
  'El conductor',
  'Ana va al concierto en el Estadio Akron y quiere llegar con su lugar asegurado.',
  [],
  5000,
)
await open('/')
await say(
  'Conductor · Paso 1 de 4',
  'Elige recinto y evento',
  'Cinco estadios y auditorios de la ZMG, más el <b>Estadio 3 de Marzo</b>. Al elegir un evento, la app propone llegar <b>2 horas antes</b> y salir <b>1 hora después</b>, en horas completas.',
)
await tap(app.getByRole('link', { name: /Estadio Akron/ }))
await heading('Próximos eventos').waitFor()
await pause(1500)
await tap(app.getByRole('link', { name: /Concierto de ejemplo/ }))

await heading('Cocheras cerca de Estadio Akron').waitFor()
await say(
  'Conductor · Paso 2 de 4',
  'Mapa y lista sincronizados',
  'Solo cocheras a <b>3 km o menos</b>. La disponibilidad se actualiza sola cada 15 segundos: las que ya reservó alguien aparecen como <span class="hi">No disponible</span>.',
)
await scrollApp(500)
await say(
  'Conductor · Paso 2 de 4',
  'Privacidad del anfitrión',
  'El punto del mapa está desplazado <b>100 a 200 m</b> y la distancia va redondeada. La dirección exacta solo se ve al confirmar la reserva.',
)
await tap(app.getByRole('button', { name: 'Cajón techado para auto compacto', exact: true }))
await heading('Cajón techado para auto compacto').waitFor()
await say(
  'Conductor · Paso 2 de 4',
  'Detalle de la cochera',
  'Fotos, medidas, autos que caben, reseñas y anfitrión verificado. El precio lo fija ParkApp: <b>$60 por hora</b> en zona Akron, más <b>$50 por reserva</b> por estar a menos de 3 km.',
)
await scrollApp(700)
await pause(1500)

await tap(app.getByRole('button', { name: 'Crear cuenta para continuar' }))
await heading('Crea tu cuenta').waitFor()
await say(
  'Cuenta verificada',
  'Antes del paso 3, una cuenta verificada',
  'Teléfono con código SMS, datos personales con <b>mayoría de edad</b> y aviso de privacidad, su auto, e <b>identidad con INE y selfie</b>. Todo simulado por ahora.',
)
await type(app.getByLabel('Teléfono', { exact: true }), '3312345678')
await tap(app.getByRole('button', { name: 'Enviar código' }))
await type(app.getByLabel('Código de 6 dígitos'), '000000')
await tap(app.getByRole('button', { name: 'Verificar' }))
await app.getByRole('heading', { name: 'Tus datos' }).waitFor()
await type(app.getByLabel('Nombre(s)'), 'Ana')
await type(app.getByLabel('Apellidos'), 'López García')
await app.getByLabel('Fecha de nacimiento').fill('1995-03-02')
await type(app.getByLabel('Correo electrónico'), 'ana@example.com')
await tap(app.getByLabel(/Acepto el aviso de privacidad/))
await tap(app.getByRole('button', { name: 'Guardar y continuar' }))
await app.getByRole('heading', { name: 'Tu auto' }).waitFor()
await type(app.getByLabel('Placa'), 'jal482a')
await type(app.getByLabel('Marca'), 'Nissan')
await type(app.getByLabel('Modelo'), 'Versa')
await type(app.getByLabel('Color'), 'Gris')
await tap(app.getByRole('button', { name: 'Guardar auto y continuar' }))
await app.getByRole('heading', { name: 'Verifica tu identidad' }).waitFor()
await tap(app.getByRole('button', { name: 'Verificar mi identidad' }))
await say(
  'Cuenta verificada',
  'Y vuelve justo a donde iba',
  'Al aprobarse la identidad, regresa al paso 3 con la misma cochera y el mismo horario.',
)
await heading('Tu horario').waitFor({ timeout: 20_000 })

await say(
  'Conductor · Paso 3 de 4',
  'Horario y precio exacto',
  'Elige llegada y salida <b>por horas completas</b>. Su auto ya está registrado, así que no escribe la placa. El servidor calcula el desglose:',
)
await scrollApp(500)
await say(
  'Conductor · Paso 3 de 4',
  'Tarifa × horas + zona + comisión + IVA',
  'Renta: <b>7 h × $60</b>. Zona de recinto: <b>$50</b>. Comisión de ParkApp: <b>15 %</b>. IVA: <b>16 % sobre la comisión</b>. Todo en centavos enteros.',
  1000,
)
await tap(app.getByRole('button', { name: 'Continuar al pago' }))

await heading('Pago').waitFor()
await say(
  'Conductor · Paso 4 de 4',
  'Pagar y reservar',
  'Pago anticipado con tarjeta (Stripe, simulado). La cochera queda apartada 10 minutos mientras paga, y es <b>imposible reservarla dos veces</b>.',
)
await tap(app.getByRole('button', { name: /Pagar y reservar/ }))
await heading('Lugar reservado').waitFor()
await say(
  'Reserva confirmada',
  'El boleto',
  'Código de acceso, placa, cajón y ahora sí la <b>dirección exacta</b>. Con <span class="hi">Cómo llegar</span> abre la ruta en Google Maps hasta el punto exacto.',
)
await scrollApp(700)
await say(
  'Reserva confirmada',
  'Cancelación clara',
  'Gratis hasta <b>2 horas antes</b>; después, penalización del <b>20 %</b>. La pantalla dice la hora límite y cuánto costaría.',
)
await scrollApp(600)
await pause(1500)

// Arrival and departure: jump to the day of the event.
const booking = await db(() => window.__mockDb.listBookings('mock-user-3312345678')[0])
await card(
  'Día del evento',
  'Llegar y salir',
  'Adelantamos el reloj al día del concierto, 10 minutos antes de la hora de llegada.',
  [],
  4500,
)
await context.clock.setSystemTime(Date.parse(booking.startsAt) - 10 * 60_000)
await open(`/bookings/${booking.id}`)
await app.getByRole('button', { name: /Registrar llegada/ }).waitFor()
await app.getByRole('button', { name: /Registrar llegada/ }).scrollIntoViewIfNeeded()
await say(
  'Llegada',
  'Registrar la llegada con fotos',
  'Se abre <b>30 minutos antes</b>. Ana sube de 2 a 4 fotos del auto y del cajón: protegen a ambas partes si hay un daño.',
)
await app.getByLabel('Agregar fotos').setInputFiles(await photos(['Mi auto', 'El cajón']))
await pause(1500)
await tap(app.getByRole('button', { name: /Registrar llegada/ }))
await app.getByText('En uso', { exact: true }).first().waitFor()
await say(
  'En uso',
  'La reserva está en uso',
  'Muestra hasta qué hora puede salir y cuánto cuesta cada hora extra. Hay <b>10 minutos de tolerancia</b>.',
)

await context.clock.setSystemTime(Date.parse(booking.endsAt) + 70 * 60_000)
await open(`/bookings/${booking.id}`)
await app.getByRole('button', { name: /Registrar salida/ }).scrollIntoViewIfNeeded()
await say(
  'Salida',
  'Se pasó 1 h 10 min',
  'Se cobra <b>cada hora iniciada</b> a la tarifa por hora, más comisión e IVA, a la misma tarjeta. Al salir, otras fotos.',
)
await app.getByLabel('Agregar fotos').setInputFiles(await photos(['Al salir', 'Cajón libre']))
await pause(1200)
await tap(app.getByRole('button', { name: /Registrar salida/ }))
await app.getByText(/horas extra: se cobraron/).waitFor()
await app.getByText(/horas extra: se cobraron/).scrollIntoViewIfNeeded()
await say(
  'Completada',
  'Resumen de la estancia',
  'Hora de llegada, de salida y lo que se cobró por las horas extra.',
)

await tap(app.getByRole('button', { name: /Reportar un problema/ }))
await say(
  'Incidencias',
  'Reportar un problema',
  'Daño, acceso, seguridad u otro, hasta <b>7 días</b> después. ParkApp media entre conductor y anfitrión; no custodia los autos.',
)
await app.getByLabel('Tipo de problema').selectOption('damage')
await type(app.getByLabel('Qué pasó'), 'Al regresar encontré un rayón en la puerta trasera.')
await tap(app.getByRole('button', { name: 'Enviar reporte' }))
await app.getByText(/Reportaste: Daño/).waitFor()
await pause(2500)

// ───────────────────────────── Host ─────────────────────────────
await card(
  'Parte 2',
  'El anfitrión',
  'Ana también tiene una cochera. Con la misma cuenta y la misma identidad verificada, cambia a modo anfitrión.',
  [],
  5500,
)
await open('/profile')
await tap(app.getByRole('button', { name: 'Cambiar a modo anfitrión' }))
await heading('Mis cocheras').waitFor()
await say(
  'Una cuenta, dos modos',
  'Modo anfitrión',
  'Cada modo tiene su barra inferior. La franja oscura de arriba recuerda en qué modo está y lleva de vuelta en un toque.',
)
await tap(app.getByRole('button', { name: /Publicar una cochera/ }).first())

await heading('¿Dónde está tu cochera?').waitFor()
await say(
  'Anfitrión · Paso 1 de 4',
  'Ubicación',
  'Recinto cercano, dirección y el <b>pin de la entrada</b>, que debe quedar a menos de 3 km. La dirección solo la verá quien reserve.',
)
await app.getByLabel('Recinto cercano').selectOption('akron')
await type(app.getByLabel('Calle y número'), 'Av. Patria 1234')
await type(app.getByLabel('Colonia'), 'Jardines Universidad')
await app.getByLabel('Municipio').selectOption('Zapopan')
await tap(app.getByRole('button', { name: 'Mover al este' }))
await tap(app.getByRole('button', { name: 'Mover al este' }))
await pause(1200)
await tap(app.getByRole('button', { name: 'Continuar' }))

await heading('Medidas del espacio').waitFor()
await type(app.getByLabel(/Largo/), '520')
await type(app.getByLabel(/Ancho/), '300')
await type(app.getByLabel(/Altura de la entrada/), '230')
await app.getByText(/Caben:/).scrollIntoViewIfNeeded()
await say(
  'Anfitrión · Paso 2 de 4',
  'Medidas y registro múltiple',
  'ParkApp <b>calcula qué autos caben</b>. Y quien tiene varios cajones iguales, como un estacionamiento, los publica <b>en un solo registro</b>.',
)
const quantity = app.getByLabel(/Cuántos cajones iguales/)
await quantity.fill('')
await type(quantity, '3')
await tap(app.getByLabel('Techado'))
await tap(app.getByLabel('Portón eléctrico'))
await tap(app.getByRole('button', { name: 'Continuar' }))

await heading('Fotos y descripción').waitFor()
await say(
  'Anfitrión · Paso 3 de 4',
  'Fotos y descripción',
  'De 3 a 8 fotos y cómo se entra. <b>El título lo escribe ParkApp</b>, para que publicar tome menos de 15 campos.',
)
await app.getByLabel('Agregar fotos').setInputFiles(await photos(['Entrada', 'Cajones', 'Portón']))
await pause(1200)
await type(app.getByLabel('Descripción (opcional)'), 'Portón negro junto a la farmacia.')
await tap(app.getByRole('button', { name: 'Continuar' }))

await heading('Precio').waitFor()
await say(
  'Anfitrión · Paso 4 de 4',
  'Lo que gana',
  'El anfitrión no adivina un precio: ParkApp lo fija por zona. Gana <b>$60 por hora + $50</b> por reserva; la comisión y su IVA los paga el conductor.',
)
await app.getByRole('switch', { name: 'Disponible siempre' }).scrollIntoViewIfNeeded()
await tap(app.getByRole('switch', { name: 'Disponible siempre' }))
await say(
  'Anfitrión · Paso 4 de 4',
  'Cuándo lo renta',
  'Siempre, o solo algunos días y horas. Fuera de ese horario la cochera no aparece en las búsquedas.',
)
await tap(app.getByLabel(/Declaro que tengo derecho a rentar/))
await say(
  'Anfitrión · Paso 4 de 4',
  'Declaración y reglas',
  'Declara que puede rentar el espacio (dueño, contrato o permiso del condominio) y acepta las reglas. Los términos completos están a un toque.',
)
await tap(app.getByRole('button', { name: 'Publicar cochera' }))
await heading('Tu cochera está en revisión').waitFor()
await say(
  'Revisión',
  'Antes de salir al público',
  'El back-office revisa fotos y datos. Aquí lo aprobamos al momento.',
)
await db(() => window.__mockDb.approveAllSpacesNow())
await tap(app.getByRole('button', { name: 'Ver mis cocheras' }))
await app.getByText('Publicada').waitFor()
await say(
  'Mis cocheras',
  'Publicada',
  '<b>3 cajones</b>, su horario, lo que gana por hora. Puede pausarla o cambiar el horario cuando quiera.',
)

// A driver books it, and the host sees who is coming.
await db(() => {
  const m = window.__mockDb
  const space = m.listHostSpaces('mock-user-3312345678')[0]
  const other = 'mock-user-3322222222'
  const vehicleId = m.seedVerifiedAccount(other, { plate: 'JKL123B' }).vehicles[0].id
  // Next Saturday, 5 to 10 p.m. in Guadalajara (UTC-6): inside the host's schedule.
  const day = 86_400_000
  let saturday = ''
  for (let d = 1; d <= 8 && !saturday; d++) {
    const t = new Date(Date.now() + d * day)
    const wd = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Mexico_City',
      weekday: 'short',
    }).format(t)
    if (wd === 'Sat')
      saturday = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City' }).format(t)
  }
  const startsAt = `${saturday}T23:00:00.000Z`
  const endsAt = new Date(Date.parse(startsAt) + 5 * 3_600_000).toISOString()
  const b = m.createBooking(other, { spaceId: space.id, startsAt, endsAt, vehicleId })
  m.confirmBooking(other, b.id, 'pi_demo')
})
await open('/host/bookings')
await app.getByText('Tú ganas').first().waitFor()
await say(
  'Reservas recibidas',
  'Quién llega',
  'Nombre de pila, insignia de verificado y su auto. <b>Nunca</b> teléfono, correo ni INE. Ve cuánto gana y, si cancela, el conductor recibe el <b>100 %</b>.',
)
await scrollApp(400)
await pause(2000)

await open('/terms')
await say(
  'Legal',
  'Términos y condiciones',
  'Los 10 puntos de la presentación: intermediario, registro, obligaciones, pagos, cancelación, responsabilidad, datos, suspensión y PROFECO. <b>Texto provisional</b> hasta que lo revise un abogado.',
)
await scrollApp(900)
await pause(2500)

// ───────────────────────────── Closing ─────────────────────────────
await card(
  'Resumen',
  'Listo para conectar el backend',
  'Todo corre hoy contra una API simulada que aplica las mismas reglas que deberá cumplir el servidor.',
  [
    'Doble reserva imposible, también con varios cajones',
    'Dinero en centavos enteros y fechas en UTC',
    'Español e inglés, WCAG AA, objetivos de 44 px',
    '409 pruebas unitarias y 87 de punta a punta',
    'Siguiente: Stripe Connect, Truora y Google Maps reales',
    'Contrato: docs/api/openapi.draft.yaml',
  ],
  10_000,
)

await context.close()
await browser.close()
console.log(DRY ? 'dry run ok' : `video in ${OUT}`)

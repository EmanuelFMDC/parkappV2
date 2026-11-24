import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { LatLng, Venue } from '../../api/types'
import { Providers } from '../../app/Providers'
import i18n from '../../i18n'
import { distanceM, offsetPoint } from '../../lib/geo'
import { API_URL } from '../../mocks/handlers'
import { resetTestDb, testDb } from '../../mocks/server'
import { venues } from '../../mocks/domain/seed'
import HostSpacesPage from '../../pages/host/HostSpacesPage'
import PriceStep from '../../pages/host/PriceStep'
import SizeStep from '../../pages/host/SizeStep'
import OnboardingPage from '../../pages/account/OnboardingPage'
import { createMockServices } from '../../services'
import { RequireAccount } from '../account/RequireAccount'
import { EMPTY_DRAFT, type HostDraft } from './draft'
import { PhotoUploader } from './PhotoUploader'
import { PinPicker } from './PinPicker'

const akron: Venue = venues.find((v) => v.id === 'akron')!
const USER = 'mock-google-user'

function Where() {
  const { pathname, search } = useLocation()
  return <p data-testid="where">{pathname + search}</p>
}

async function signedIn() {
  const services = createMockServices()
  await services.auth.signInWithGoogle()
  return services
}

function renderPage(
  url: string,
  element: React.ReactNode,
  path: string,
  services = createMockServices(),
) {
  return render(
    <Providers apiBaseUrl={API_URL} services={services}>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route element={<RequireAccount role="host" />}>
            <Route path={path} element={element} />
          </Route>
          <Route path="*" element={<Where />} />
        </Routes>
      </MemoryRouter>
    </Providers>,
  )
}

/** A host who finished their data and identity, without registering any car. */
function verifiedHostWithoutCar() {
  const db = testDb()
  db.updateProfile(USER, {
    firstName: 'Marisol',
    lastName: 'Ríos',
    birthDate: '1988-04-12',
    email: 'marisol@example.com',
    acceptPrivacy: true,
  })
  db.startIdentity(USER)
}

const readyDraft = (over: Partial<HostDraft> = {}): HostDraft => ({
  ...EMPTY_DRAFT,
  venueId: 'akron',
  street: 'Av. Patria 1234',
  neighborhood: 'Jardines Universidad',
  municipality: 'Zapopan',
  location: offsetPoint(akron.location, 600, 90),
  lengthCm: '520',
  widthCm: '300',
  heightCm: '230',
  quantity: '1',
  availability: null,
  photos: [
    { key: 'mock/a.jpg', name: 'a.jpg' },
    { key: 'mock/b.jpg', name: 'b.jpg' },
    { key: 'mock/c.jpg', name: 'c.jpg' },
  ],
  acceptTerms: true,
  ...over,
})
const saveDraft = (draft: HostDraft) =>
  sessionStorage.setItem('parkapp.host.draft', JSON.stringify(draft))

beforeEach(async () => {
  sessionStorage.clear()
  resetTestDb({ identityDelayMs: 0, reviewDelayMs: 0 })
  await i18n.changeLanguage('es-MX')
})

describe('PinPicker', () => {
  function Harness({ initial, venue = akron }: { initial: LatLng | null; venue?: Venue }) {
    const [value, setValue] = useState(initial)
    return (
      <div>
        <PinPicker venue={venue} value={value} onChange={setValue} />
        <p data-testid="meters">{value ? distanceM(value, venue.location) : 'none'}</p>
      </div>
    )
  }

  it('asks for the venue first', () => {
    render(<PinPicker venue={undefined} value={null} onChange={() => undefined} />)
    expect(screen.getByText(/Elige primero el recinto cercano/)).toBeInTheDocument()
  })

  it('moves the pin 50 meters with the direction buttons and says how far it is', async () => {
    render(<Harness initial={offsetPoint(akron.location, 400, 90)} />)
    expect(screen.getByRole('status')).toHaveTextContent(/A 400\s?m de Estadio Akron/)

    await userEvent.click(screen.getByRole('button', { name: 'Mover al este' }))
    expect(Number(screen.getByTestId('meters').textContent)).toBeGreaterThanOrEqual(445)
    expect(screen.getByRole('status')).toHaveTextContent(/A 450\s?m/)

    await userEvent.click(screen.getByRole('button', { name: 'Mover al oeste' }))
    await userEvent.click(screen.getByRole('button', { name: 'Mover al oeste' }))
    expect(screen.getByRole('status')).toHaveTextContent(/A 350\s?m/)
  })

  it('warns, in text and not only color, when the pin is outside the radius', () => {
    render(<Harness initial={offsetPoint(akron.location, 3400, 0)} />)
    expect(screen.getByRole('status')).toHaveTextContent(/fuera del radio de 3\s?km/)
  })

  it('starts a pin near the venue when there is none yet', async () => {
    render(<Harness initial={null} />)
    expect(screen.getByRole('status')).toHaveTextContent('Aún no marcas la entrada.')
    await userEvent.click(screen.getByRole('button', { name: 'Mover al norte' }))
    expect(Number(screen.getByTestId('meters').textContent)).toBeGreaterThan(300)
  })
})

describe('PhotoUploader', () => {
  function Harness() {
    const [photos, setPhotos] = useState<{ key: string; name: string }[]>([])
    return <PhotoUploader photos={photos} onChange={setPhotos} />
  }
  const file = (name: string, type = 'image/jpeg', size = 1000) => {
    const f = new File(['x'], name, { type })
    Object.defineProperty(f, 'size', { value: size })
    return f
  }
  const pick = (...files: File[]) => userEvent.upload(screen.getByLabelText('Agregar fotos'), files)

  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:preview')
    URL.revokeObjectURL = vi.fn()
  })

  it('uploads valid photos and counts them, the first being the cover', async () => {
    renderWith(<Harness />)
    await pick(file('a.jpg'), file('b.png', 'image/png'))
    expect(await screen.findByText('2 de 8 fotos (mínimo 3)')).toBeInTheDocument()
    expect(screen.getByText('Portada')).toBeInTheDocument()
  })

  it('rejects files that are not JPG, PNG or WebP, and says which', async () => {
    renderWith(<Harness />)
    await userEvent.upload(
      screen.getByLabelText('Agregar fotos'),
      file('notes.pdf', 'application/pdf'),
      { applyAccept: false },
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'notes.pdf: usa fotos JPG, PNG o WebP.',
    )
    expect(screen.getByText('0 de 8 fotos (mínimo 3)')).toBeInTheDocument()
  })

  it('rejects photos over 10 MB', async () => {
    renderWith(<Harness />)
    await pick(file('huge.jpg', 'image/jpeg', 11 * 1024 * 1024))
    expect(await screen.findByRole('alert')).toHaveTextContent('huge.jpg: pesa más de 10 MB.')
  })

  it('takes at most 8 photos', async () => {
    renderWith(<Harness />)
    await pick(...Array.from({ length: 10 }, (_, i) => file(`p${i}.jpg`)))
    expect(await screen.findByText('8 de 8 fotos (mínimo 3)')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Solo caben 8 fotos.')
  })

  it('removes a photo', async () => {
    renderWith(<Harness />)
    await pick(file('a.jpg'), file('b.jpg'))
    await screen.findByText('2 de 8 fotos (mínimo 3)')
    await userEvent.click(screen.getByRole('button', { name: 'Quitar foto a.jpg' }))
    expect(screen.getByText('1 de 8 fotos (mínimo 3)')).toBeInTheDocument()
  })

  function renderWith(ui: React.ReactNode) {
    return render(<Providers apiBaseUrl={API_URL}>{ui}</Providers>)
  }
})

describe('guarded host steps', () => {
  it('sends someone without an account to create one as a host', async () => {
    renderPage('/host/new/size', <SizeStep />, 'host/new/size')
    expect(await screen.findByTestId('where')).toHaveTextContent('/account/new?next=')
    expect(screen.getByTestId('where')).toHaveTextContent('as=host')
  })

  it('lets a verified host with no car through', async () => {
    const services = await signedIn()
    verifiedHostWithoutCar()
    saveDraft(readyDraft())
    renderPage('/host/new/size', <SizeStep />, 'host/new/size', services)
    expect(await screen.findByRole('heading', { name: 'Medidas del espacio' })).toBeInTheDocument()
  })

  it('does not let anyone skip the location step by typing the address', async () => {
    const services = await signedIn()
    verifiedHostWithoutCar()
    renderPage('/host/new/size', <SizeStep />, 'host/new/size', services)
    expect(await screen.findByTestId('where')).toHaveTextContent('/host/new/location')
  })
})

describe('size step', () => {
  async function renderSize() {
    const services = await signedIn()
    verifiedHostWithoutCar()
    saveDraft(readyDraft({ lengthCm: '', widthCm: '', heightCm: '' }))
    renderPage('/host/new/size', <SizeStep />, 'host/new/size', services)
    await screen.findByRole('heading', { name: 'Medidas del espacio' })
  }
  const type = async (label: string, value: string) =>
    userEvent.type(screen.getByLabelText(new RegExp(label)), value)

  it('works out which cars fit as the measurements are typed, without asking', async () => {
    await renderSize()
    await type('Largo', '520')
    await type('Ancho', '300')
    await type('Altura', '230')
    expect(screen.getByText(/Caben:/).parentElement).toHaveTextContent('Compacto, Sedán, SUV.')
    expect(screen.queryByRole('checkbox', { name: 'Pick-up' })).not.toBeInTheDocument()
  })

  it('asks how many identical spots, 1 by default', async () => {
    await renderSize()
    const quantity = screen.getByLabelText(/Cuántos cajones iguales/)
    expect(quantity).toHaveValue('1')
    await type('Largo', '520')
    await type('Ancho', '300')
    await type('Altura', '230')
    await userEvent.clear(quantity)
    await userEvent.type(quantity, '0')
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(await screen.findByText('Escribe cuántos cajones, entre 1 y 20.')).toBeInTheDocument()
  })

  it('warns when the measurements fit no standard car', async () => {
    await renderSize()
    await type('Largo', '300')
    await type('Ancho', '200')
    await type('Altura', '200')
    expect(screen.getByText(/no cabe un auto estándar/)).toBeInTheDocument()
  })

  it('shows what is wrong with a measurement before moving on', async () => {
    await renderSize()
    await type('Largo', '520')
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    expect((await screen.findAllByRole('alert'))[0]).toHaveTextContent(
      'Revisa el largo, el ancho y la altura.',
    )
  })
})

describe('publishing', () => {
  async function renderPrice(over: Partial<HostDraft> = {}) {
    const services = await signedIn()
    verifiedHostWithoutCar()
    saveDraft(readyDraft(over))
    renderPage('/host/new/price', <PriceStep />, 'host/new/price', services)
    await screen.findByRole('heading', { name: 'Precio' })
    return services
  }

  it('publishes the space in review and clears the draft', async () => {
    await renderPrice()
    await userEvent.click(screen.getByRole('button', { name: 'Publicar cochera' }))
    expect(await screen.findByTestId('where')).toHaveTextContent('/host/new/done')

    const [space] = testDb().listHostSpaces(USER)
    expect(space).toMatchObject({
      title: 'Cochera en Jardines Universidad', // written by ParkApp
      priceCentsPerHour: 6000, // the Akron tariff
      street: 'Av. Patria 1234',
    })
    expect(sessionStorage.getItem('parkapp.host.draft')).toBeNull()
  })

  it('shows what the host earns from the zone tariff, with no price to type', async () => {
    await renderPrice()
    expect(await screen.findByText('$60 por hora')).toBeInTheDocument()
    expect(screen.getByText(/Zona Estadio Akron/)).toHaveTextContent('$50 extra')
    // 4 h × $60 + $50
    expect(screen.getByText(/Una reserva de 4 horas te deja \$290/)).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: /precio/i })).not.toBeInTheDocument()
  })

  it('publishes with a schedule: weekend evenings to start, then edited', async () => {
    await renderPrice()
    const always = await screen.findByRole('switch', { name: 'Disponible siempre' })
    expect(always).toBeChecked()
    await userEvent.click(always)
    expect(screen.getByRole('button', { name: 'viernes' })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(screen.getByRole('button', { name: 'domingo' }))
    await userEvent.selectOptions(screen.getByLabelText('Hasta'), '2')
    expect(screen.getByText('Termina a la mañana siguiente.')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Publicar cochera' }))
    expect(await screen.findByTestId('where')).toHaveTextContent('/host/new/done')
    expect(testDb().listHostSpaces(USER)[0]?.availability).toEqual({
      days: [5, 6],
      fromHour: 16,
      toHour: 2,
    })
  })

  it('needs the host rules accepted', async () => {
    await renderPrice({ acceptTerms: false })
    await userEvent.click(screen.getByRole('button', { name: 'Publicar cochera' }))
    expect(await screen.findByText(/declarar que puedes rentar el espacio/)).toBeInTheDocument()
  })

  it('sends the host back to fix the address when the server finds a duplicate', async () => {
    await renderPrice()
    testDb().createHostSpace(USER, {
      venueId: 'akron',
      street: 'Av. Patria 1234',
      neighborhood: 'Otra colonia',
      municipality: 'Zapopan',
      location: offsetPoint(akron.location, 500, 90),
      dimensions: { lengthCm: 520, widthCm: 300, heightCm: 230 },
      quantity: 1,
      availability: null,
      features: [],
      description: '',
      photoKeys: ['a', 'b', 'c'],
      acceptHostTerms: true,
    })
    await userEvent.click(screen.getByRole('button', { name: 'Publicar cochera' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Ya publicaste una cochera en esta dirección',
    )
    expect(screen.getByRole('link', { name: 'Corregir' })).toHaveAttribute(
      'href',
      '/host/new/location',
    )
  })
})

describe('host home', () => {
  const renderHome = (services = createMockServices()) =>
    render(
      <Providers apiBaseUrl={API_URL} services={services}>
        <MemoryRouter initialEntries={['/host']}>
          <Routes>
            <Route path="host" element={<HostSpacesPage />} />
            <Route path="*" element={<Where />} />
          </Routes>
        </MemoryRouter>
      </Providers>,
    )

  it('invites a newcomer to start, and sends them to register as a host', async () => {
    renderHome()
    await userEvent.click(await screen.findByRole('button', { name: 'Empezar a publicar' }))
    const where = await screen.findByTestId('where')
    expect(where).toHaveTextContent('/account/new')
    expect(where).toHaveTextContent('as=host')
  })

  it('shows an empty state to a verified host with nothing published', async () => {
    const services = await signedIn()
    verifiedHostWithoutCar()
    renderHome(services)
    expect(await screen.findByText('Aún no publicas ninguna cochera')).toBeInTheDocument()
  })

  it('pauses and resumes a live space', async () => {
    const services = await signedIn()
    verifiedHostWithoutCar()
    testDb().createHostSpace(USER, {
      venueId: 'akron',
      street: 'Av. Patria 1234',
      neighborhood: 'Jardines Universidad',
      municipality: 'Zapopan',
      location: offsetPoint(akron.location, 500, 90),
      dimensions: { lengthCm: 520, widthCm: 300, heightCm: 230 },
      quantity: 1,
      availability: null,
      features: [],
      description: '',
      photoKeys: ['a', 'b', 'c'],
      acceptHostTerms: true,
    })
    testDb().approveAllSpacesNow()
    renderHome(services)

    expect(await screen.findByText('Publicada')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Pausar' }))
    expect(await screen.findByText('Pausada')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Reactivar' }))
    expect(await screen.findByText('Publicada')).toBeInTheDocument()
  })

  it('shows a live space with what the host earns, and no way to change the price', async () => {
    const services = await signedIn()
    verifiedHostWithoutCar()
    testDb().createHostSpace(USER, {
      venueId: 'akron',
      street: 'Av. Patria 1234',
      neighborhood: 'Jardines Universidad',
      municipality: 'Zapopan',
      location: offsetPoint(akron.location, 500, 90),
      dimensions: { lengthCm: 520, widthCm: 300, heightCm: 230 },
      quantity: 1,
      availability: null,
      features: [],
      description: '',
      photoKeys: ['a', 'b', 'c'],
      acceptHostTerms: true,
    })
    testDb().approveAllSpacesNow()
    renderHome(services)

    expect(await screen.findByText('Ganas $60 por hora')).toBeInTheDocument()
    expect(screen.getByText(/\+ \$50 por reserva/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cambiar precio' })).not.toBeInTheDocument()
  })

  it('shows the spots and schedule of a space, and changes the schedule', async () => {
    const services = await signedIn()
    verifiedHostWithoutCar()
    testDb().createHostSpace(USER, {
      venueId: 'akron',
      street: 'Av. Patria 1234',
      neighborhood: 'Jardines Universidad',
      municipality: 'Zapopan',
      location: offsetPoint(akron.location, 500, 90),
      dimensions: { lengthCm: 520, widthCm: 300, heightCm: 230 },
      quantity: 3,
      availability: null,
      features: [],
      description: '',
      photoKeys: ['a', 'b', 'c'],
      acceptHostTerms: true,
    })
    testDb().approveAllSpacesNow()
    renderHome(services)

    expect(await screen.findByText(/3 cajones · Disponible siempre/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Cambiar horario' }))
    const dialog = screen.getByRole('dialog', { name: 'Cambiar horario' })
    await userEvent.click(within(dialog).getByRole('switch', { name: 'Disponible siempre' }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Guardar horario' }))

    expect(await screen.findByText(/3 cajones · vie, sáb, dom, de 4/)).toBeInTheDocument()
    expect(testDb().listHostSpaces(USER)[0]?.availability).toEqual({
      days: [5, 6, 7],
      fromHour: 16,
      toHour: 24,
    })
  })

  it('shows a rejected space with the reason and a way to list it again', async () => {
    const services = await signedIn()
    verifiedHostWithoutCar()
    testDb().setReviewOutcome('rejected')
    testDb().createHostSpace(USER, {
      venueId: 'akron',
      street: 'Av. Patria 1234',
      neighborhood: 'Jardines Universidad',
      municipality: 'Zapopan',
      location: offsetPoint(akron.location, 500, 90),
      dimensions: { lengthCm: 520, widthCm: 300, heightCm: 230 },
      quantity: 1,
      availability: null,
      features: [],
      description: '',
      photoKeys: ['a', 'b', 'c'],
      acceptHostTerms: true,
    })
    renderHome(services)
    expect(await screen.findByText('Rechazada')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(/fotos/)
    expect(screen.getByRole('link', { name: 'Publicar de nuevo' })).toBeInTheDocument()
  })
})

describe('registering as a host', () => {
  it('has three steps, with no car', async () => {
    const services = await signedIn()
    render(
      <Providers apiBaseUrl={API_URL} services={services}>
        <MemoryRouter initialEntries={['/account/new?as=host&next=%2Fhost']}>
          <Routes>
            <Route path="account/new" element={<OnboardingPage />} />
            <Route path="*" element={<Where />} />
          </Routes>
        </MemoryRouter>
      </Providers>,
    )
    expect(await screen.findByText('Paso 2 de 3')).toBeInTheDocument()
    expect(screen.getByText(/necesitamos saber quién eres/)).toBeInTheDocument()

    testDb().updateProfile(USER, {
      firstName: 'Marisol',
      lastName: 'Ríos',
      birthDate: '1988-04-12',
      email: 'marisol@example.com',
      acceptPrivacy: true,
    })
    await userEvent.type(screen.getByLabelText('Nombre(s)'), 'x') // trigger a re-render path safely
    // The profile exists server-side now; the next refresh moves on to identity, never to a car.
    expect(screen.queryByRole('heading', { name: 'Tu auto' })).not.toBeInTheDocument()
  })
})

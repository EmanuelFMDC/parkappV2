import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Providers } from './app/Providers'
import { AppShell } from './components/layout/AppShell'
import { RequireAccount } from './features/account/RequireAccount'

const VenuePage = lazy(() => import('./pages/driver/VenuePage'))
const SpacesPage = lazy(() => import('./pages/driver/SpacesPage'))
const SpaceDetailPage = lazy(() => import('./pages/driver/SpaceDetailPage'))
const TimePage = lazy(() => import('./pages/driver/TimePage'))
const PayPage = lazy(() => import('./pages/driver/PayPage'))
const OnboardingPage = lazy(() => import('./pages/account/OnboardingPage'))
const HostHomePage = lazy(() => import('./pages/host/HostHomePage'))
const LocationStep = lazy(() => import('./pages/host/LocationStep'))
const SizeStep = lazy(() => import('./pages/host/SizeStep'))
const PhotosStep = lazy(() => import('./pages/host/PhotosStep'))
const PriceStep = lazy(() => import('./pages/host/PriceStep'))
const HostDonePage = lazy(() => import('./pages/host/DonePage'))
const BookingsPage = lazy(() => import('./pages/driver/BookingsPage'))
const BookingPage = lazy(() => import('./pages/driver/BookingPage'))
const ProfilePage = lazy(() => import('./pages/driver/ProfilePage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const StyleguidePage = lazy(() =>
  import('./styleguide/StyleguidePage').then((m) => ({ default: m.StyleguidePage })),
)

export default function App() {
  return (
    <Providers>
      <BrowserRouter>
        <Suspense fallback={null}>
          <Routes>
            <Route path="design-system" element={<StyleguidePage />} />
            <Route element={<AppShell />}>
              <Route index element={<VenuePage />} />
              <Route path="venues/:venueId/spaces" element={<SpacesPage />} />
              <Route path="spaces/:spaceId" element={<SpaceDetailPage />} />
              <Route path="account/new" element={<OnboardingPage />} />
              {/* Steps 3 and 4 need a complete, verified account. */}
              <Route element={<RequireAccount />}>
                <Route path="book/:spaceId/time" element={<TimePage />} />
                <Route path="book/:spaceId/pay" element={<PayPage />} />
              </Route>
              <Route path="bookings" element={<BookingsPage />} />
              <Route path="host" element={<HostHomePage />} />
              {/* Publishing needs personal data and a verified identity, but no car. */}
              <Route element={<RequireAccount role="host" />}>
                <Route path="host/new/location" element={<LocationStep />} />
                <Route path="host/new/size" element={<SizeStep />} />
                <Route path="host/new/photos" element={<PhotosStep />} />
                <Route path="host/new/price" element={<PriceStep />} />
                <Route path="host/new/done" element={<HostDonePage />} />
              </Route>
              <Route path="bookings/:bookingId" element={<BookingPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </Providers>
  )
}

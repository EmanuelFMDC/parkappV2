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

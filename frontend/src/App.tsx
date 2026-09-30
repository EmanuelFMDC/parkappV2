import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { SessionProvider } from './lib/session'

const Explore = lazy(() => import('./screens/Explore'))
const LotDetail = lazy(() => import('./screens/LotDetail'))
const Booking = lazy(() => import('./screens/Booking'))
const Confirmation = lazy(() => import('./screens/Confirmation'))
const Spot = lazy(() => import('./screens/Spot'))
const History = lazy(() => import('./screens/History'))
const Profile = lazy(() => import('./screens/Profile'))
const Vehicles = lazy(() => import('./screens/Vehicles'))
const PaymentMethods = lazy(() => import('./screens/PaymentMethods'))

export default function App() {
  return (
    <SessionProvider>
      <BrowserRouter>
        <Suspense fallback={null}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<Explore />} />
              <Route path="lot/:id" element={<LotDetail />} />
              <Route path="lot/:id/book" element={<Booking />} />
              <Route path="ticket" element={<Confirmation />} />
              <Route path="spot" element={<Spot />} />
              <Route path="history" element={<History />} />
              <Route path="profile" element={<Profile />} />
              <Route path="profile/vehicles" element={<Vehicles />} />
              <Route path="profile/payment" element={<PaymentMethods />} />
              <Route path="*" element={<Explore />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </SessionProvider>
  )
}

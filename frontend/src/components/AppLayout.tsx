import { Outlet, useLocation } from 'react-router-dom'
import { BottomNav } from './ui'

const tabRoutes = ['/', '/spot', '/history', '/profile']

export function AppLayout() {
  const { pathname } = useLocation()
  const showNav = tabRoutes.includes(pathname)
  return (
    <div className="mx-auto min-h-dvh max-w-md bg-canvas md:shadow-sheet">
      <main className={showNav ? 'pb-24' : 'pb-8'}>
        <Outlet />
      </main>
      {showNav && <BottomNav />}
    </div>
  )
}

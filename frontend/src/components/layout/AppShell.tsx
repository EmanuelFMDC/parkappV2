import { CalendarCheck, Compass, Inbox, UserRound, Warehouse } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { modeOf, type Mode } from '../../lib/mode'
import { BottomNav } from '../ui'
import { ModeBanner } from './ModeBanner'
import { useModeMemory } from './useModeMemory'

/** Each mode has its own bar. The profile exists in both so nobody has to leave their mode to reach it. */
const TABS: Record<Mode, { key: string; icon: React.ReactNode; label: string }[]> = {
  driver: [
    { key: '/', icon: <Compass />, label: 'nav.explore' },
    { key: '/bookings', icon: <CalendarCheck />, label: 'nav.bookings' },
    { key: '/profile', icon: <UserRound />, label: 'nav.profile' },
  ],
  host: [
    { key: '/host', icon: <Warehouse />, label: 'nav.hostSpaces' },
    { key: '/host/bookings', icon: <Inbox />, label: 'nav.hostBookings' },
    { key: '/host/profile', icon: <UserRound />, label: 'nav.profile' },
  ],
}

export function AppShell() {
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const mainRef = useRef<HTMLElement>(null)
  const firstRender = useRef(true)
  const mode = modeOf(pathname)
  const tabs = TABS[mode]
  const isTab = tabs.some((tab) => tab.key === pathname)
  useModeMemory({ pathname, search, mode, isTab })

  // SPA route changes: move focus to the new view and update the tab title (WCAG 2.4.2, 2.4.3).
  useEffect(() => {
    const main = mainRef.current
    const heading = main?.querySelector('h1')?.textContent
    document.title = heading ? `${heading} · ParkApp` : 'ParkApp'
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    main?.focus({ preventScroll: true })
    window.scrollTo({ top: 0 })
  }, [pathname, i18n.language])

  return (
    <>
      {mode === 'host' && isTab && <ModeBanner />}
      <main ref={mainRef} tabIndex={-1} className={`outline-none ${isTab ? 'pb-24' : ''}`}>
        <Outlet />
      </main>
      {isTab && (
        <BottomNav
          current={pathname}
          onSelect={(key) => navigate(key)}
          items={tabs.map((tab) => ({ key: tab.key, icon: tab.icon, label: t(tab.label) }))}
        />
      )}
    </>
  )
}

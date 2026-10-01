import { CalendarCheck, Compass, UserRound } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { BottomNav } from '../ui'

const tabs = [
  { key: '/', icon: <Compass />, label: 'nav.explore' },
  { key: '/bookings', icon: <CalendarCheck />, label: 'nav.bookings' },
  { key: '/profile', icon: <UserRound />, label: 'nav.profile' },
] as const

export function AppShell() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const mainRef = useRef<HTMLElement>(null)
  const firstRender = useRef(true)
  const isTab = tabs.some((tab) => tab.key === pathname)

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

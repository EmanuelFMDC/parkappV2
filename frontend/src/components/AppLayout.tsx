import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet, useLocation } from 'react-router-dom'
import { BottomNav } from './ui'

const tabRoutes = ['/', '/spot', '/history', '/profile']

export function AppLayout() {
  const { pathname } = useLocation()
  const { t, i18n } = useTranslation()
  const mainRef = useRef<HTMLElement>(null)
  const firstRender = useRef(true)
  const showNav = tabRoutes.includes(pathname)

  // SPA route changes: move focus to the new view and update the document title (WCAG 2.4.2, 2.4.3).
  useEffect(() => {
    const main = mainRef.current
    const h1 = main?.querySelector('h1')?.textContent
    document.title = h1 ? `${h1} · ${t('app.name')}` : t('app.name')
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    main?.focus({ preventScroll: true })
    window.scrollTo({ top: 0 })
  }, [pathname, i18n.language, t])

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-canvas md:shadow-sheet">
      <main ref={mainRef} tabIndex={-1} className={`outline-none ${showNav ? 'pb-24' : 'pb-8'}`}>
        <Outlet />
      </main>
      {showNav && <BottomNav />}
    </div>
  )
}

import clsx from 'clsx'
import { CarFront, Compass, History, UserRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'

const items = [
  { to: '/', key: 'explore', icon: Compass, end: true },
  { to: '/spot', key: 'sessions', icon: CarFront, end: false },
  { to: '/history', key: 'history', icon: History, end: false },
  { to: '/profile', key: 'profile', icon: UserRound, end: false },
] as const

export function BottomNav() {
  const { t } = useTranslation()
  return (
    <nav
      aria-label={t('nav.main')}
      className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="grid grid-cols-4">
        {items.map(({ to, key, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                clsx(
                  'flex h-16 flex-col items-center justify-center gap-1 text-caption font-semibold transition-colors',
                  isActive ? 'text-primary' : 'text-ink-subtle hover:text-ink',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="size-6" strokeWidth={isActive ? 2.5 : 2} aria-hidden />
                  {t(`nav.${key}`)}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

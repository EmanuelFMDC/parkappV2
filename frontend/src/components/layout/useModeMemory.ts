import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccount } from '../../features/account/hooks'
import type { Mode } from '../../lib/mode'
import {
  canRestoreHost,
  markRestoreChecked,
  readMode,
  wasRestoreChecked,
  writeMode,
} from '../../lib/modePreference'

interface Where {
  pathname: string
  search: string
  mode: Mode
  /** One of the bottom-bar screens: the clearest sign of which mode the person is in. */
  isTab: boolean
}

interface Startup {
  stored: Mode | null
  checked: boolean
}

/**
 * Remembers the last mode and brings the person back to it when they open the app.
 *
 * - The mode is saved whenever they are on one of the bottom-bar screens.
 * - Host mode is restored only when the app is opened at the bare root, once per browser tab, and
 *   only for someone whose host account is ready (otherwise they would land on an invitation).
 * - Tapping "Explorar" later never jumps to host mode, and neither does a link or a reload.
 */
export function useModeMemory({ pathname, search, mode, isTab }: Where) {
  const navigate = useNavigate()
  const { stage, loading } = useAccount('host')
  const startup = useRef<Startup | null>(null)
  const decided = useRef(false)

  useEffect(() => {
    // Read before anything is written, or opening the app would overwrite what we want to restore.
    startup.current ??= { stored: readMode(), checked: wasRestoreChecked() }
    const { stored, checked } = startup.current

    const pending =
      !decided.current && canRestoreHost({ pathname, search, stored, alreadyChecked: checked })

    if (!decided.current && !pending) {
      // Opened somewhere else, or moved on before we knew: the tab has started, nothing to restore.
      markRestoreChecked()
      decided.current = true
    }

    if (pending) {
      if (loading) return // wait for the account, and do not overwrite the saved mode meanwhile
      markRestoreChecked()
      decided.current = true
      if (stage === 'ready') {
        navigate('/host', { replace: true })
        return
      }
    }

    if (isTab) writeMode(mode)
  }, [pathname, search, mode, isTab, loading, stage, navigate])
}

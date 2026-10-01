import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '../../i18n'
import { BottomSheet, type SheetState } from './BottomSheet'
import { Button } from './Button'
import { Input } from './Input'
import { Segmented } from './Segmented'
import { SpaceCard } from './SpaceCard'
import { StepIndicator } from './StepIndicator'
import { Switch } from './Switch'

beforeEach(async () => {
  await i18n.changeLanguage('es-MX')
})

describe('Button', () => {
  it('is busy and not clickable while loading', async () => {
    const onClick = vi.fn()
    render(
      <Button loading onClick={onClick}>
        Reservando
      </Button>,
    )
    const button = screen.getByRole('button', { name: 'Reservando' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    await userEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('defaults to type="button" so it never submits a form by accident', () => {
    render(<Button>Seguir</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
  })
})

describe('Input', () => {
  it('associates label, hint and error with the field', () => {
    render(<Input label="Placa" hint="Tres letras" error="Falta la placa" />)
    const field = screen.getByLabelText('Placa')
    expect(field).toHaveAttribute('aria-invalid', 'true')
    expect(field).toHaveAccessibleDescription('Falta la placa')
    expect(screen.getByRole('alert')).toHaveTextContent('Falta la placa')
  })

  it('shows the hint when there is no error', () => {
    render(<Input label="Placa" hint="Tres letras" />)
    expect(screen.getByLabelText('Placa')).toHaveAccessibleDescription('Tres letras')
  })
})

describe('Segmented', () => {
  it('exposes a radio group and reports changes', async () => {
    const onChange = vi.fn()
    render(
      <Segmented
        label="Llegada"
        value="now"
        onChange={onChange}
        options={[
          { value: 'now', label: 'Ahora' },
          { value: 'in30', label: 'En 30 min' },
        ]}
      />,
    )
    expect(screen.getByRole('group', { name: 'Llegada' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Ahora' })).toBeChecked()
    await userEvent.click(screen.getByText('En 30 min'))
    expect(onChange).toHaveBeenCalledWith('in30')
  })
})

describe('Switch', () => {
  it('toggles and exposes aria-checked', async () => {
    const onChange = vi.fn()
    render(<Switch checked={false} onChange={onChange} label="Avisos" />)
    const toggle = screen.getByRole('switch', { name: 'Avisos' })
    expect(toggle).toHaveAttribute('aria-checked', 'false')
    await userEvent.click(toggle)
    expect(onChange).toHaveBeenCalledWith(true)
  })
})

describe('StepIndicator', () => {
  it('announces progress and marks the current step', () => {
    render(<StepIndicator steps={['Recinto', 'Cochera', 'Horario', 'Pago']} current={2} />)
    expect(screen.getByText(/Paso 2 de 4/)).toBeInTheDocument()
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(4)
    expect(items[1]).toHaveAttribute('aria-current', 'step')
    expect(items[0]).not.toHaveAttribute('aria-current')
    expect(items[0]).toHaveTextContent('(completado)')
  })
})

describe('SpaceCard', () => {
  it('formats the price from integer cents and selects on click', async () => {
    const onSelect = vi.fn()
    render(
      <SpaceCard
        title="Cochera con portón"
        distanceLabel="A 350 m del recinto"
        priceCents={7550}
        rating={4.9}
        reviewCount={128}
        onSelect={onSelect}
      />,
    )
    expect(screen.getByText('$75.50')).toBeInTheDocument()
    expect(screen.getByText(/4\.9 de 5, 128 reseñas/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Cochera con portón' }))
    expect(onSelect).toHaveBeenCalledOnce()
  })
})

describe('BottomSheet', () => {
  function Harness({ initial }: { initial: SheetState }) {
    const [state, setState] = useState<SheetState>(initial)
    return (
      <BottomSheet
        label="Cocheras"
        state={state}
        onStateChange={setState}
        summary={<p>3 cocheras</p>}
      >
        <button type="button">Dentro</button>
      </BottomSheet>
    )
  }

  it('toggles between peek and half with the handle and makes hidden content inert', async () => {
    render(<Harness initial="half" />)
    const handle = screen.getByRole('button', { name: 'Reducir panel de resultados' })
    expect(handle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Dentro').closest('[inert]')).toBeNull()

    await userEvent.click(handle)
    const collapsed = screen.getByRole('button', { name: 'Ampliar panel de resultados' })
    expect(collapsed).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByText('Dentro', { selector: 'button' }).closest('[inert]')).not.toBeNull()
  })

  it('steps through heights with the arrow keys', async () => {
    render(<Harness initial="peek" />)
    const handle = screen.getByRole('button', { name: 'Ampliar panel de resultados' })
    handle.focus()
    await userEvent.keyboard('{ArrowUp}')
    expect(handle).toHaveAttribute('aria-expanded', 'true')
    await userEvent.keyboard('{ArrowDown}')
    expect(handle).toHaveAttribute('aria-expanded', 'false')
  })
})

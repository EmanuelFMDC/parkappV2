import { useMutation } from '@tanstack/react-query'
import type { Booking, BookingCreate } from '../../api/types'
import { useServices } from '../../services/context'
import { useConfirmBooking, useCreateBooking } from './hooks'

export class PaymentFailed extends Error {}

/**
 * Hold the space, take payment, then confirm. If payment fails the pre-booking simply expires
 * (10 min) and the space is released; nothing is charged.
 */
export function usePayAndReserve() {
  const { payments } = useServices()
  const create = useCreateBooking()
  const confirm = useConfirmBooking()

  return useMutation<Booking, Error, BookingCreate>({
    mutationFn: async (input) => {
      const held = await create.mutateAsync(input)
      const intent = await payments.createPaymentIntent({
        bookingId: held.id,
        amountCents: held.totalCents,
      })
      const result = await payments.confirm(intent.clientSecret)
      if (result.status !== 'succeeded') throw new PaymentFailed(result.reason)
      return confirm.mutateAsync({ bookingId: held.id, paymentIntentId: intent.clientSecret })
    },
  })
}

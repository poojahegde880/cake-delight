
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { Basket, Cake, Customer, NotificationStatus, Order, RatingSummary } from './types'
import { notificationApi } from './api'

export const inr = (n: number) => '₹' + n.toLocaleString('en-IN')

const ART: Record<string, [string, string, string]> = {
  Chocolate: ['#6b3a2a', '#c47b5a', '🍫'],
  Classic: ['#c2185b', '#ff7a9c', '🎂'],
  Fruit: ['#ff7a59', '#ffc1a1', '🍓'],
  Cheesecake: ['#5b5fc7', '#a9b4ff', '🍰'],
}

const art = (c: string) => ART[c] ?? ['#e4577a', '#ff9a8b', '🧁']

export const Stars = ({ v }: { v: number }) => (
  <span className="text-amber-400 tracking-wider">
    {'★'.repeat(Math.round(v)) + '☆'.repeat(5 - Math.round(v))}
  </span>
)

export function CakeArt({ cake, size }: { cake: Cake; size: string }) {
  const [a, b, e] = art(cake.category)

  return (
    <div
      className="grid place-items-center overflow-hidden"
      style={{
        background: `linear-gradient(135deg,${a},${b})`,
        height: size,
      }}
    >
      {cake.imageUrl ? (
        <img src={cake.imageUrl} alt={cake.name} className="h-full w-full object-cover" />
      ) : (
        <span style={{ fontSize: `calc(${size} * .5)` }}>{e}</span>
      )}
    </div>
  )
}

export function CakeCard({
  cake,
  rating,
  i,
  onOpen,
  onAdd,
}: {
  cake: Cake
  rating?: RatingSummary
  i: number
  onOpen: () => void
  onAdd: () => void
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.04 }}
      whileHover={{ y: -6 }}
      className="flex flex-col overflow-hidden rounded-3xl bg-white shadow-lg shadow-rose-200/50"
    >
      <button onClick={onOpen} className="relative block">
        <CakeArt cake={cake} size="170px" />
        <span className="absolute left-3 top-3 rounded-full bg-white/85 px-3 py-0.5 text-xs font-semibold">
          {cake.category}
        </span>
      </button>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="font-display text-xl font-bold">{cake.name}</h3>

        <div className="text-sm text-stone-500">
          <Stars v={rating?.average ?? 0} /> {(rating?.average ?? 0).toFixed(1)} (
          {rating?.count ?? 0})
        </div>

        <p className="line-clamp-2 text-sm text-stone-500">{cake.description}</p>

        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-lg font-bold">{inr(cake.price)}</span>

          <button
            disabled={!cake.available}
            onClick={onAdd}
            className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:bg-stone-200 disabled:text-stone-400"
          >
            {cake.available ? 'Add' : 'Sold out'}
          </button>
        </div>
      </div>
    </motion.article>
  )
}

export function Modal({
  children,
  onClose,
}: {
  children: React.ReactNode
  onClose: () => void
}) {
  return (
    <motion.div
      className="fixed inset-0 z-40 grid place-items-center bg-black/50 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white"
        initial={{ scale: 0.92, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92 }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 h-9 w-9 rounded-full bg-white/90"
        >
          ✕
        </button>
        {children}
      </motion.div>
    </motion.div>
  )
}

export function CakeDetail({
  cake,
  rating,
  onRate,
  onAdd,
  onClose,
}: {
  cake: Cake
  rating?: RatingSummary
  onRate: (s: number) => Promise<void>
  onAdd: () => void
  onClose: () => void
}) {
  const [pick, setPick] = useState(0)
  const [busy, setBusy] = useState(false)

  return (
    <Modal onClose={onClose}>
      <CakeArt cake={cake} size="200px" />

      <div className="space-y-2 p-6">
        <div className="text-sm text-stone-500">{cake.category}</div>
        <h2 className="font-display text-3xl font-bold">{cake.name}</h2>

        <div className="text-sm">
          <Stars v={rating?.average ?? 0} />
          <span className="text-stone-500">
            {' '}{(rating?.average ?? 0).toFixed(1)} from {rating?.count ?? 0} ratings
          </span>
        </div>

        <p className="text-stone-600">{cake.description}</p>

        <div className="pt-2 text-sm text-stone-500">Rate this cake</div>

        <div className="flex items-center gap-1 text-3xl">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              aria-label={`${n} stars`}
              onClick={() => setPick(n)}
              className={`transition hover:scale-125 ${
                n <= pick ? 'text-amber-400' : 'text-rose-100'
              }`}
            >
              ★
            </button>
          ))}

          <button
            disabled={!pick || busy}
            onClick={async () => {
              setBusy(true)
              try {
                await onRate(pick)
              } finally {
                setBusy(false)
              }
            }}
            className="ml-3 rounded-full bg-cocoa px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-30"
          >
            Submit
          </button>
        </div>

        <div className="flex items-center justify-between pt-3">
          <span className="text-xl font-bold">{inr(cake.price)}</span>

          <button
            disabled={!cake.available}
            onClick={onAdd}
            className="rounded-full bg-brand px-5 py-2.5 font-semibold text-white disabled:bg-stone-200"
          >
            Add to basket
          </button>
        </div>
      </div>
    </Modal>
  )
}

export function BasketDrawer({
  basket,
  onClose,
  onQty,
  onRemove,
  onCheckout,
}: {
  basket: Basket
  onClose: () => void
  onQty: (id: string, q: number) => void
  onRemove: (id: string) => void
  onCheckout: (c: Customer) => Promise<void>
}) {
  const [form, setForm] = useState(false)

  // Customer details for checkout
  const [c, setC] = useState<Customer>({
    name: '',
    email: '',
    phone: '',
    address: '',
  })

  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  // Validate customer details and place order
  const submit = async () => {
    if (c.name.trim().length < 2) {
      return setErr('Please enter your name.')
    }

    if (!/^\S+@\S+\.\S+$/.test(c.email)) {
      return setErr('Please enter a valid email.')
    }

    if (!/^\d{10}$/.test(c.phone)) {
      return setErr('Please enter a valid 10-digit phone number.')
    }

    if (c.address.trim().length < 5) {
      return setErr('Please enter a delivery address.')
    }

    setErr('')
    setBusy(true)

    try {
      await onCheckout(c)
    } catch (e) {
      setErr((e as Error).message || 'Checkout failed, please retry.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <motion.div
        className="fixed inset-0 z-30 bg-black/45"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      <motion.aside
        className="fixed bottom-0 right-0 top-0 z-30 flex w-full max-w-md flex-col bg-cream"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
      >
        <div className="flex items-center justify-between border-b border-rose-100 p-5">
          <h2 className="font-display text-2xl font-bold">Your basket</h2>
          <button onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="flex-1 space-y-1 overflow-auto px-5 py-3">
          {basket.items.length === 0 && (
            <div className="py-16 text-center text-stone-500">
              <div className="text-5xl">🛒</div>
              Your basket is empty.
            </div>
          )}

          {basket.items.map(it => (
            <div
              key={it.cakeId}
              className="flex items-center gap-3 border-b border-dashed border-rose-100 py-3"
            >
              <div className="flex-1">
                <b>{it.name}</b>
                <div className="text-sm text-stone-500">{inr(it.unitPrice)}</div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  aria-label="Decrease"
                  onClick={() => onQty(it.cakeId, it.quantity - 1)}
                  className="h-7 w-7 rounded-full border-2 border-rose-100"
                >
                  −
                </button>

                <b>{it.quantity}</b>

                <button
                  aria-label="Increase"
                  onClick={() => onQty(it.cakeId, it.quantity + 1)}
                  className="h-7 w-7 rounded-full border-2 border-rose-100"
                >
                  +
                </button>
              </div>

              <button
                aria-label="Remove"
                onClick={() => onRemove(it.cakeId)}
              >
                🗑️
              </button>
            </div>
          ))}
        </div>

        {basket.items.length > 0 && (
          <div className="space-y-2.5 border-t border-rose-100 bg-white p-5">
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>{inr(basket.total)}</span>
            </div>

            {form ? (
              <>
                <input
                  placeholder="Full name"
                  value={c.name}
                  onChange={e => setC({ ...c, name: e.target.value })}
                  className="w-full rounded-xl border border-rose-200 p-3"
                />

                <input
                  type="email"
                  placeholder="Email for confirmation"
                  value={c.email}
                  onChange={e => setC({ ...c, email: e.target.value })}
                  className="w-full rounded-xl border border-rose-200 p-3"
                />

                <input
                  type="tel"
                  placeholder="10-digit phone number"
                  value={c.phone}
                  maxLength={10}
                  onChange={e =>
                    setC({ ...c, phone: e.target.value.replace(/\D/g, '') })
                  }
                  className="w-full rounded-xl border border-rose-200 p-3"
                />

                <input
                  placeholder="Delivery address"
                  value={c.address}
                  onChange={e => setC({ ...c, address: e.target.value })}
                  className="w-full rounded-xl border border-rose-200 p-3"
                />

                <div className="min-h-4 text-xs text-red-600">{err}</div>

                <button
                  disabled={busy}
                  onClick={submit}
                  className="w-full rounded-2xl bg-gradient-to-r from-orange-300 to-brand py-3.5 font-semibold text-white disabled:opacity-60"
                >
                  {busy ? 'Placing order…' : 'Place order'}
                </button>
              </>
            ) : (
              <button
                onClick={() => setForm(true)}
                className="w-full rounded-2xl bg-gradient-to-r from-orange-300 to-brand py-3.5 font-semibold text-white"
              >
                Checkout
              </button>
            )}
          </div>
        )}
      </motion.aside>
    </>
  )
}

/** Order confirmation; polls the Notification service for the delivery status of the confirmation */
export function OrderSuccess({
  order,
  email,
  onClose,
}: {
  order: Order
  email: string
  onClose: () => void
}) {
  const [n, setN] = useState<NotificationStatus['status']>('PENDING')

  useEffect(() => {
    let tries = 0

    const t = setInterval(async () => {
      try {
        const s = await notificationApi.status(order.orderId)
        setN(s.status)

        if (s.status !== 'PENDING') {
          clearInterval(t)
        }
      } catch {
        // Notification may not have been created yet
      }

      if (++tries > 15) {
        clearInterval(t)
      }
    }, 1500)

    return () => clearInterval(t)
  }, [order.orderId])

  const label = {
    PENDING: '⏳ Sending confirmation…',
    SENT: `📧 Confirmation sent to ${email}`,
    FAILED: '⚠️ Could not send the confirmation email',
  }[n]

  return (
    <Modal onClose={onClose}>
      <div className="grid h-40 place-items-center bg-gradient-to-br from-emerald-600 to-emerald-300 text-7xl">
        🎉
      </div>

      <div className="space-y-3 p-6">
        <h2 className="font-display text-3xl font-bold">Order confirmed!</h2>

        <p>
          Order <b>{order.orderId}</b> · {inr(order.total)} ·{' '}
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-sm">
            {order.status}
          </span>
        </p>

        <p className="rounded-xl bg-rose-50 p-3 text-sm">{label}</p>

        <button
          onClick={onClose}
          className="w-full rounded-2xl bg-brand py-3 font-semibold text-white"
        >
          Continue shopping
        </button>
      </div>
    </Modal>
  )
}

export { AnimatePresence }

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { catalogApi, orderApi, ratingApi } from './api'
import { AnimatePresence, BasketDrawer, CakeCard, CakeDetail, OrderSuccess } from './components'
import type { Basket, Cake, Customer, Order, RatingSummary } from './types'

const CATS = ['All', 'Chocolate', 'Classic', 'Fruit', 'Cheesecake']

function useDebounced<T>(v: T, ms = 300) {
  const [d, setD] = useState(v)
  useEffect(() => { const t = setTimeout(() => setD(v), ms); return () => clearTimeout(t) }, [v, ms])
  return d
}

export default function App() {
  const [f, setF] = useState({ name: '', category: 'All', maxPrice: 1500 })
  const [cakes, setCakes] = useState<Cake[]>([])
  const [ratings, setRatings] = useState<Record<string, RatingSummary>>({})
  const [basket, setBasket] = useState<Basket>({ items: [], total: 0 })
  const [sel, setSel] = useState<Cake | null>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [done, setDone] = useState<{ order: Order; email: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const name = useDebounced(f.name)

  const say = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2800) }
  const loadRatings = async (list: Cake[]) => {
    const r = await Promise.all(list.map(c => ratingApi.summary(c.id).catch(() => ({ average: 0, count: 0 }))))
    setRatings(Object.fromEntries(list.map((c, i) => [c.id, r[i]])))
  }

  useEffect(() => {
    setLoading(true); setError('')
    catalogApi.list({ name, category: f.category, maxPrice: f.maxPrice })
      .then(l => { setCakes(l); loadRatings(l) })
      .catch(e => setError(e.message || 'Could not load cakes'))
      .finally(() => setLoading(false))
  }, [name, f.category, f.maxPrice])

  useEffect(() => { orderApi.basket().then(setBasket).catch(() => {}) }, [])

  const run = async (p: Promise<Basket>) => { try { setBasket(await p) } catch (e) { say((e as Error).message || 'Basket update failed') } }
  const add = (c: Cake) => { run(orderApi.add(c.id)); say(`${c.name} added to basket 🎂`) }
  const qty = (id: string, q: number) => run(q <= 0 ? orderApi.remove(id) : orderApi.update(id, q))
  const count = basket.items.reduce((s, i) => s + i.quantity, 0)

  const checkout = async (c: Customer) => {
    const order = await orderApi.checkout(c)
    setBasket({ items: [], total: 0 }); setCartOpen(false); setDone({ order, email: c.email })
  }
  const rate = async (cake: Cake, stars: number) => {
    try { await ratingApi.submit(cake.id, stars); say('Thanks for your rating ⭐'); setSel(null); loadRatings(cakes) } catch (e) { say((e as Error).message) }
  }

  return (
    <div>
      <header className="sticky top-0 z-20 border-b border-rose-100 bg-cream/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-5 py-3">
          <div className="font-display text-2xl font-extrabold text-brand">🍰 Cake Delight</div>
          <input className="order-last w-full sm:order-none sm:mx-auto sm:w-auto sm:max-w-md sm:flex-1" type="search" placeholder="Search cakes by name…" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
          <button onClick={() => setCartOpen(true)} aria-label="Open basket" className="relative ml-auto h-11 w-11 rounded-full border-2 border-rose-100 bg-white sm:ml-0">🛒
            {count > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[11px] font-semibold text-white">{count}</span>}</button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-20">
        <section className="relative my-6 overflow-hidden rounded-[28px] bg-gradient-to-br from-orange-300 via-brand to-fuchsia-700 p-8 text-white sm:p-12">
          <h1 className="max-w-lg font-display text-4xl font-extrabold leading-tight sm:text-6xl">Baked fresh. Delivered with love.</h1>
          <p className="my-4 max-w-md opacity-90">Handcrafted cakes for every celebration. Pick your favourite and we’ll handle the rest.</p>
          <a href="#menu" className="inline-block rounded-full bg-white px-6 py-3 font-semibold text-brand">Browse cakes</a>
          <motion.div animate={{ y: [0, -12, 0], rotate: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 4 }} className="absolute -bottom-4 right-6 text-[110px] sm:text-[190px]">🎂</motion.div>
        </section>

        <section id="menu" className="scroll-mt-24">
          <div className="mb-5 flex flex-wrap items-center gap-4">
            <div className="flex flex-1 flex-wrap gap-2">
              {CATS.map(c => <button key={c} onClick={() => setF({ ...f, category: c })} className={`rounded-full border-2 px-4 py-2 font-medium transition ${f.category === c ? 'border-brand bg-brand text-white' : 'border-rose-100 bg-white'}`}>{c}</button>)}
            </div>
            <label className="flex items-center gap-3 text-sm text-stone-500">Up to <b className="text-cocoa">₹{f.maxPrice}</b>
              <input type="range" min={300} max={1500} step={50} value={f.maxPrice} onChange={e => setF({ ...f, maxPrice: +e.target.value })} className="!w-36 !border-0 !p-0 accent-brand" /></label>
          </div>

          {error && <div className="rounded-2xl bg-red-50 p-6 text-center text-red-700">⚠️ {error}<br /><span className="text-sm">Is the API Gateway running?</span></div>}
          {loading && !cakes.length && <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-5">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-80 animate-pulse rounded-3xl bg-rose-100/60" />)}</div>}
          {!error && !loading && !cakes.length && <div className="py-16 text-center text-stone-500"><div className="text-5xl">🔍</div>No cakes match your filters.</div>}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-5">
            {cakes.map((c, i) => <CakeCard key={c.id} cake={c} i={i} rating={ratings[c.id]} onOpen={() => setSel(c)} onAdd={() => add(c)} />)}
          </div>
        </section>
      </main>

      <AnimatePresence>
        {sel && <CakeDetail key="d" cake={sel} rating={ratings[sel.id]} onRate={s => rate(sel, s)} onAdd={() => { add(sel); setSel(null) }} onClose={() => setSel(null)} />}
        {cartOpen && <BasketDrawer key="b" basket={basket} onClose={() => setCartOpen(false)} onQty={qty} onRemove={id => qty(id, 0)} onCheckout={checkout} />}
        {done && <OrderSuccess key="o" order={done.order} email={done.email} onClose={() => setDone(null)} />}
      </AnimatePresence>
      {toast && <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-2xl bg-cocoa px-5 py-3 text-white shadow-xl">{toast}</div>}
    </div>
  )
}

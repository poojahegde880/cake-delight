import type { Basket, Cake, Customer, NotificationStatus, Order, RatingSummary } from '../types'

// All calls go through the API Gateway: /api/<service>/...
const BASE = import.meta.env.VITE_API_URL || '/api'
class ApiError extends Error { constructor(public status: number, msg: string) { super(msg) } }

// Anonymous user id so the Order service can keep a per-user basket
export const userId = () => {
  let id = localStorage.getItem('cd_uid')
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('cd_uid', id) }
  return id
}

// Fetch wrapper with timeout + retry (exponential backoff) on network/5xx errors
async function http<T>(path: string, init: RequestInit = {}, retries = 2): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(BASE + path, {
        ...init, signal: AbortSignal.timeout(8000),
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId(), ...init.headers },
      })
      if (!res.ok) throw new ApiError(res.status, (await res.text()) || res.statusText)
      return (res.status === 204 ? undefined : await res.json()) as T
    } catch (e) {
      if ((e instanceof ApiError && e.status < 500) || attempt >= retries) throw e
      await new Promise(r => setTimeout(r, 300 * 2 ** attempt))
    }
  }
}
const body = (o: unknown) => ({ body: JSON.stringify(o) })

/** Cake Catalog service */
export const catalogApi = {
  list: (f: { name: string; category: string; maxPrice: number }) => {
    const q = new URLSearchParams({ maxPrice: String(f.maxPrice) })
    if (f.name) q.set('name', f.name)
    if (f.category !== 'All') q.set('category', f.category)
    return http<Cake[]>(`/catalog/cakes?${q}`)
  },
  get: (id: string) => http<Cake>(`/catalog/cakes/${id}`),
}

/** Order service (basket + checkout) */
export const orderApi = {
  basket: () => http<Basket>('/orders/basket'),
  add: (cakeId: string, quantity = 1) => http<Basket>('/orders/basket/items', { method: 'POST', ...body({ cakeId, quantity }) }),
  update: (cakeId: string, quantity: number) => http<Basket>(`/orders/basket/items/${cakeId}`, { method: 'PUT', ...body({ quantity }) }),
  remove: (cakeId: string) => http<Basket>(`/orders/basket/items/${cakeId}`, { method: 'DELETE' }),
  checkout: (c: Customer) => http<Order>('/orders/checkout', { method: 'POST', ...body(c) }, 0),
}

/** Rating service */
export const ratingApi = {
  summary: (cakeId: string) => http<RatingSummary>(`/ratings/${cakeId}/summary`),
  submit: (cakeId: string, stars: number) => http<void>('/ratings', { method: 'POST', ...body({ cakeId, stars }) }),
}

/** Notification service (delivery status of the order-confirmation event) */
export const notificationApi = {
  status: (orderId: string) => http<NotificationStatus>(`/notifications/${orderId}`),
}

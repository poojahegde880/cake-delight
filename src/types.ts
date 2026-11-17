export type Cake = { id: string; name: string; description: string; category: string; price: number; available: boolean; imageUrl?: string }
export type BasketItem = { cakeId: string; name: string; unitPrice: number; quantity: number }
export type Basket = { items: BasketItem[]; total: number }
export type Customer = { name: string; email: string; phone: string; address: string }
export type Order = { orderId: string; status: string; total: number; createdAt: string }
export type RatingSummary = { average: number; count: number }
export type NotificationStatus = { orderId: string; channel: string; status: 'PENDING' | 'SENT' | 'FAILED' }

// Mock Database Service
// In-memory stateful data for hackathon demo

// --- Types ---

export type OrderStatus = 'UNFULFILLED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED'

export type Order = {
  id: string
  name: string
  status: OrderStatus
  trackingUrl: string | null
  createdAt: string
  items: { title: string; quantity: number }[]
  customerId: string
}

export type Customer = {
  id: string
  email: string
  name: string
  storeCredit: {
    amount: string
    currencyCode: string
  }
  tags: string[]
}

export type SubscriptionStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED'

export type Subscription = {
  id: string
  customerId: string
  email: string
  status: SubscriptionStatus
  nextBillingDate: string
  productTitle: string
  interval: string
}

// --- Initial Data ---

const orders: Map<string, Order> = new Map([
  [
    '1001',
    {
      id: '1001',
      name: '#1001',
      status: 'IN_TRANSIT',
      trackingUrl: 'https://fedex.com/track/123456789',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
      items: [
        { title: 'BuzzPatch Mosquito Repellent (60 Pack)', quantity: 1 },
        { title: 'ZenPatch Calming Stickers (24 Pack)', quantity: 2 }
      ],
      customerId: 'cust_jane'
    }
  ],
  [
    '999',
    {
      id: '999',
      name: '#999',
      status: 'DELIVERED',
      trackingUrl: 'https://fedex.com/track/987654321',
      createdAt: new Date(Date.now() - 86400000 * 30).toISOString(), // 30 days ago
      items: [{ title: 'FocusPatch Concentration Stickers (24 Pack)', quantity: 1 }],
      customerId: 'cust_jane'
    }
  ]
])

const customers: Map<string, Customer> = new Map([
  [
    'jane@example.com',
    {
      id: 'cust_jane',
      email: 'jane@example.com',
      name: 'Jane Doe',
      storeCredit: { amount: '0.00', currencyCode: 'USD' },
      tags: []
    }
  ]
])

const subscriptions: Map<string, Subscription> = new Map([
  [
    'sub_123',
    {
      id: 'sub_123',
      customerId: 'cust_jane',
      email: 'jane@example.com',
      status: 'ACTIVE',
      nextBillingDate: new Date(Date.now() + 86400000 * 15).toISOString(), // 15 days later
      productTitle: 'Hair Growth Serum (3 Month Supply)',
      interval: '3 Months'
    }
  ]
])

// --- Order Functions ---

export const getOrder = (orderId: string): Order | null => {
  // Normalize order ID (remove # prefix if present)
  const normalizedId = orderId.replace(/^#/, '')
  return orders.get(normalizedId) || null
}

export const getOrdersByCustomer = (email: string): Order[] => {
  const customer = customers.get(email)
  if (!customer) return []
  return Array.from(orders.values()).filter(o => o.customerId === customer.id)
}

export const updateOrder = (
  orderId: string,
  updates: Partial<Omit<Order, 'id'>>
): Order | null => {
  const normalizedId = orderId.replace(/^#/, '')
  const order = orders.get(normalizedId)
  if (!order) return null

  const updated = { ...order, ...updates }
  orders.set(normalizedId, updated)
  console.log(`[MockDB] Order ${normalizedId} updated:`, updates)
  return updated
}

// --- Customer Functions ---

export const getCustomer = (email: string): Customer | null => {
  return customers.get(email) || null
}

export const updateCustomerStoreCredit = (
  email: string,
  amount: string,
  currencyCode: string = 'USD'
): Customer | null => {
  let customer = customers.get(email)
  if (!customer) {
    // Create customer if not exists
    customer = {
      id: `cust_${Date.now()}`,
      email,
      name: email.split('@')[0],
      storeCredit: { amount: '0.00', currencyCode },
      tags: []
    }
    customers.set(email, customer)
  }

  const currentBalance = parseFloat(customer.storeCredit.amount)
  const addAmount = parseFloat(amount)
  const newBalance = (currentBalance + addAmount).toFixed(2)

  customer.storeCredit = { amount: newBalance, currencyCode }
  customers.set(email, customer)
  console.log(`[MockDB] Customer ${email} store credit updated: +${amount} → ${newBalance}`)
  return customer
}

export const addCustomerTag = (email: string, tag: string): Customer | null => {
  const customer = customers.get(email)
  if (!customer) return null

  if (!customer.tags.includes(tag)) {
    customer.tags.push(tag)
    customers.set(email, customer)
    console.log(`[MockDB] Customer ${email} tagged: ${tag}`)
  }
  return customer
}

// --- Subscription Functions ---

export const getSubscription = (subscriptionId: string): Subscription | null => {
  return subscriptions.get(subscriptionId) || null
}

export const getSubscriptionByEmail = (email: string): Subscription | null => {
  return (
    Array.from(subscriptions.values()).find(s => s.email === email) || null
  )
}

export const updateSubscription = (
  subscriptionId: string,
  updates: Partial<Omit<Subscription, 'id'>>
): Subscription | null => {
  const sub = subscriptions.get(subscriptionId)
  if (!sub) return null

  const updated = { ...sub, ...updates }
  subscriptions.set(subscriptionId, updated)
  console.log(`[MockDB] Subscription ${subscriptionId} updated:`, updates)
  return updated
}

// --- Utility: Reset for testing ---

export const resetMockDb = () => {
  orders.clear()
  customers.clear()
  subscriptions.clear()

  // Re-initialize with default data
  orders.set('1001', {
    id: '1001',
    name: '#1001',
    status: 'IN_TRANSIT',
    trackingUrl: 'https://fedex.com/track/123456789',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    items: [
      { title: 'BuzzPatch Mosquito Repellent (60 Pack)', quantity: 1 },
      { title: 'ZenPatch Calming Stickers (24 Pack)', quantity: 2 }
    ],
    customerId: 'cust_jane'
  })

  orders.set('999', {
    id: '999',
    name: '#999',
    status: 'DELIVERED',
    trackingUrl: 'https://fedex.com/track/987654321',
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    items: [{ title: 'FocusPatch Concentration Stickers (24 Pack)', quantity: 1 }],
    customerId: 'cust_jane'
  })

  customers.set('jane@example.com', {
    id: 'cust_jane',
    email: 'jane@example.com',
    name: 'Jane Doe',
    storeCredit: { amount: '0.00', currencyCode: 'USD' },
    tags: []
  })

  subscriptions.set('sub_123', {
    id: 'sub_123',
    customerId: 'cust_jane',
    email: 'jane@example.com',
    status: 'ACTIVE',
    nextBillingDate: new Date(Date.now() + 86400000 * 15).toISOString(),
    productTitle: 'Hair Growth Serum (3 Month Supply)',
    interval: '3 Months'
  })

  console.log('[MockDB] Database reset to initial state')
}

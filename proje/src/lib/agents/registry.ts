import type { AgentId } from './types'

export const AGENT_ORDER: AgentId[] = [
  'router',
  'order_management',
  'resolution_refund',
  'subscription_retention',
  'sales_product'
]

export const AGENT_LABELS: Record<AgentId, string> = {
  router: 'Main Router',
  order_management: 'Order Management Agent',
  resolution_refund: 'Resolution & Refund Agent',
  subscription_retention: 'Subscription Retention Agent',
  sales_product: 'Sales & Product Assistant'
}   

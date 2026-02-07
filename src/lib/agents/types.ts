export type AgentId =
  | 'router'
  | 'order_management'
  | 'resolution_refund'
  | 'subscription_retention'
  | 'sales_product'

export type AgentContext = {
  requestId: string
  input: string
  metadata?: Record<string, string>
}

export type AgentId =
  | 'router'
  | 'orchestrator'
  | 'researcher'
  | 'builder'
  | 'validator'

export type AgentContext = {
  requestId: string
  input: string
  metadata?: Record<string, string>
}

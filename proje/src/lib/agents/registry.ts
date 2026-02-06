import type { AgentId } from './types'

export const AGENT_ORDER: AgentId[] = [
  'router',
  'orchestrator',
  'researcher',
  'builder',
  'validator'
]

export const AGENT_LABELS: Record<AgentId, string> = {
  router: 'Router',
  orchestrator: 'Orchestrator',
  researcher: 'Research',
  builder: 'Build',
  validator: 'Validate'
}

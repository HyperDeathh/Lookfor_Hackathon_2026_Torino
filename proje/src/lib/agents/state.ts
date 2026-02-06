import { Annotation } from '@langchain/langgraph'
import { BaseMessage } from '@langchain/core/messages'

// Define the shape of our graph state
// We extend the basic MessagesState to include our custom fields
export const GraphState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => []
  }),
  intent: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => 'OTHER'
  }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  customerInfo: Annotation<Record<string, any>>({
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({})
  }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logs: Annotation<any[]>({
    reducer: (x, y) => x.concat(y),
    default: () => []
  }),
  // --- Escalation State (HACKATHON REQUIREMENT) ---
  isEscalated: Annotation<boolean>({
    reducer: (x, y) => x || y, // Once escalated, stays escalated
    default: () => false
  }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  escalationSummary: Annotation<Record<string, any> | null>({
    reducer: (x, y) => y ?? x,
    default: () => null
  })
})

export type AgentState = typeof GraphState.State

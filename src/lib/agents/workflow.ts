import { StateGraph, START, END } from '@langchain/langgraph'
import { ToolNode } from '@langchain/langgraph/prebuilt'
import { GraphState } from './state'
import { classifyIntent } from './routerAgent'
import { ALL_TOOLS } from './tools'
// Import Specialist Agents
import { orderManagementAgentNode } from './orderManagementAgent'
import { resolutionRefundAgentNode } from './resolutionRefundAgent'
import { subscriptionRetentionAgentNode } from './subscriptionRetentionAgent'
import { salesProductAgentNode } from './salesProductAgent'

// ═══════════════════════════════════════════════════════════════════════════
// DEBUG MODE - Set to true for full logging
// ═══════════════════════════════════════════════════════════════════════════
const DEBUG = true

const log = (...args: unknown[]) => {
  if (DEBUG) {
    console.log('[DEBUG]', new Date().toISOString(), ...args)
  }
}

// --- Nodes ---

// Router Node: Analyzes input and sets the intent
const routerNode = async (state: typeof GraphState.State) => {
  log('═══════════════════════════════════════════════════════════')
  log('ROUTER NODE - START')
  log('═══════════════════════════════════════════════════════════')

  // --- HACKATHON REQUIREMENT: Stop automation for entire session ---
  // If the session was previously escalated, do NOT process any further messages
  if (state.isEscalated) {
    log('🛑 SESSION ALREADY ESCALATED - refusing to process new messages')
    log('🛑 Human agent must handle this conversation from now on')
    return {
      intent: 'ESCALATED',
      // This will cause the workflow to end immediately
    }
  }

  const lastMessage = state.messages[state.messages.length - 1]
  const text =
    typeof lastMessage.content === 'string'
      ? lastMessage.content
      : String(lastMessage.content)

  log('Input message:', text)
  log('Total messages in state:', state.messages.length)
  log('Current isEscalated:', state.isEscalated)

  // Build conversation history for context (last 5 human messages)
  const conversationHistory = state.messages
    .filter(m => m._getType() === 'human')
    .slice(-5)
    .map(m => typeof m.content === 'string' ? m.content : String(m.content))

  log('Conversation history for context:', conversationHistory)

  const decision = await classifyIntent(text, conversationHistory)

  log('--- Router Decision ---')
  log('Intent:', decision.intent)
  log('Confidence:', decision.confidence)
  log('Reason:', decision.reason)
  log('-----------------------')
  log('ROUTER NODE - END, routing to:', decision.intent)

  return { intent: decision.intent }
}

// Tool Node: Executes the tools and handles escalation detection
const baseToolNode = new ToolNode(ALL_TOOLS)

// Custom tool node wrapper that detects escalation
const toolNodeWithEscalation = async (state: typeof GraphState.State) => {
  log('═══════════════════════════════════════════════════════════')
  log('TOOL NODE - START')
  log('═══════════════════════════════════════════════════════════')

  log('Current intent:', state.intent)
  log('isEscalated before tool call:', state.isEscalated)

  // Get the last message to see what tool was called
  const lastMsg = state.messages[state.messages.length - 1]
  if ('tool_calls' in lastMsg && Array.isArray(lastMsg.tool_calls)) {
    log('Tools being called:', lastMsg.tool_calls.map((tc: { name?: string; args?: unknown }) => ({
      name: tc.name,
      args: JSON.stringify(tc.args).substring(0, 200)
    })))
  }

  // Run the base tool node
  const result = await baseToolNode.invoke(state)

  log('Tool execution completed')

  // Check if any tool message indicates escalation
  const messages = result.messages || []
  log('Tool result messages count:', messages.length)

  for (const msg of messages) {
    log('Tool message name:', msg.name, 'content preview:',
      typeof msg.content === 'string' ? msg.content.substring(0, 200) : JSON.stringify(msg.content).substring(0, 200))

    if (msg.name === 'escalate_to_human') {
      log('🚨 [ESCALATION] Detected escalation tool call - setting isEscalated flag')
      // Parse the escalation summary from the tool output
      let escalationData = null
      try {
        const parsed = JSON.parse(
          typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
        )
        escalationData = parsed.data || parsed
      } catch {
        escalationData = { raw: msg.content }
      }
      log('Escalation data:', JSON.stringify(escalationData))

      return {
        ...result,
        isEscalated: true,
        escalationSummary: escalationData
      }
    }
  }

  log('TOOL NODE - END (no escalation)')
  return result
}

// --- Agent Node Wrappers with Debug ---

const orderManagementAgentNodeWithDebug = async (state: typeof GraphState.State) => {
  log('═══════════════════════════════════════════════════════════')
  log('ORDER MANAGEMENT AGENT - START')
  log('═══════════════════════════════════════════════════════════')
  log('Messages count:', state.messages.length)
  log('isEscalated:', state.isEscalated)

  const result = await orderManagementAgentNode(state)

  const lastMsg = result.messages[result.messages.length - 1]
  log('Agent response content:', typeof lastMsg.content === 'string' ? lastMsg.content.substring(0, 300) : 'non-string')
  log('Agent tool_calls:', 'tool_calls' in lastMsg ? JSON.stringify(lastMsg.tool_calls) : 'none')
  log('ORDER MANAGEMENT AGENT - END')

  return result
}

const resolutionRefundAgentNodeWithDebug = async (state: typeof GraphState.State) => {
  log('═══════════════════════════════════════════════════════════')
  log('RESOLUTION REFUND AGENT - START')
  log('═══════════════════════════════════════════════════════════')
  log('Messages count:', state.messages.length)
  log('isEscalated:', state.isEscalated)

  const result = await resolutionRefundAgentNode(state)

  const lastMsg = result.messages[result.messages.length - 1]
  log('Agent response content:', typeof lastMsg.content === 'string' ? lastMsg.content.substring(0, 300) : 'non-string')
  log('Agent tool_calls:', 'tool_calls' in lastMsg ? JSON.stringify(lastMsg.tool_calls) : 'none')
  log('RESOLUTION REFUND AGENT - END')

  return result
}

const subscriptionRetentionAgentNodeWithDebug = async (state: typeof GraphState.State) => {
  log('═══════════════════════════════════════════════════════════')
  log('SUBSCRIPTION RETENTION AGENT - START')
  log('═══════════════════════════════════════════════════════════')
  log('Messages count:', state.messages.length)
  log('isEscalated:', state.isEscalated)

  const result = await subscriptionRetentionAgentNode(state)

  const lastMsg = result.messages[result.messages.length - 1]
  log('Agent response content:', typeof lastMsg.content === 'string' ? lastMsg.content.substring(0, 300) : 'non-string')
  log('Agent tool_calls:', 'tool_calls' in lastMsg ? JSON.stringify(lastMsg.tool_calls) : 'none')
  log('SUBSCRIPTION RETENTION AGENT - END')

  return result
}

const salesProductAgentNodeWithDebug = async (state: typeof GraphState.State) => {
  log('═══════════════════════════════════════════════════════════')
  log('SALES PRODUCT AGENT - START')
  log('═══════════════════════════════════════════════════════════')
  log('Messages count:', state.messages.length)
  log('isEscalated:', state.isEscalated)

  const result = await salesProductAgentNode(state)

  const lastMsg = result.messages[result.messages.length - 1]
  log('Agent response content:', typeof lastMsg.content === 'string' ? lastMsg.content.substring(0, 300) : 'non-string')
  log('Agent tool_calls:', 'tool_calls' in lastMsg ? JSON.stringify(lastMsg.tool_calls) : 'none')
  log('SALES PRODUCT AGENT - END')

  return result
}

// --- Conditions ---

// Determine which agent to go to after Router
const routeToAgent = (state: typeof GraphState.State) => {
  log('routeToAgent called - intent:', state.intent)

  // If session is escalated, end immediately
  if (state.intent === 'ESCALATED' || state.isEscalated) {
    log('🛑 ESCALATED session - ending workflow without agent processing')
    return END
  }

  let target: string
  switch (state.intent) {
    case 'ORDER_MANAGEMENT':
      target = 'order_management'
      break
    case 'RESOLUTION_REFUND':
      target = 'resolution_refund'
      break
    case 'SUBSCRIPTION_RETENTION':
      target = 'subscription_retention'
      break
    case 'SALES_PRODUCT':
      target = 'sales_product'
      break
    default:
      // Fallback: Use Order Management or a Generic handler.
      // For now, let's route "OTHER" to sales/product as a general receptionist
      target = 'sales_product'
  }

  log('Routing to agent:', target)
  return target
}

// Check if the agent requested a tool call or is done
const shouldContinue = (state: typeof GraphState.State) => {
  log('shouldContinue check - isEscalated:', state.isEscalated)

  // --- ESCALATION CHECK (HACKATHON REQUIREMENT) ---
  // If the session is already escalated, STOP all automation
  if (state.isEscalated) {
    log('🛑 Session is ESCALATED - stopping automation immediately')
    return END
  }

  const messages = state.messages
  const lastMessage = messages[messages.length - 1]

  log('Last message type:', lastMessage.constructor.name)
  log('Has tool_calls:', 'tool_calls' in lastMessage)

  // If the LLM sent a tool_calls array, we must answer it
  if (
    'tool_calls' in lastMessage &&
    Array.isArray(lastMessage.tool_calls) &&
    lastMessage.tool_calls.length > 0
  ) {
    // Check if any of the tool calls is an escalation
    const hasEscalation = lastMessage.tool_calls.some(
      (tc: { name?: string }) => tc.name === 'escalate_to_human'
    )
    if (hasEscalation) {
      log('🚨 Agent is about to ESCALATE to human via tool call')
    }

    log('Tool calls found:', lastMessage.tool_calls.map((tc: { name?: string }) => tc.name))
    log('Decision: continue to TOOLS')
    return 'tools'
  }

  // Otherwise, we are done
  log('Decision: END (no tool calls)')
  return END
}

// --- Workflow Definition ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createWorkflow = (checkpointer?: any) => {
  log('Creating workflow graph...')

  const routeToolOutput = (state: typeof GraphState.State) => {
    log('routeToolOutput called - intent:', state.intent, 'isEscalated:', state.isEscalated)

    // If escalated, end immediately
    if (state.isEscalated) {
      log('🛑 Escalated - ending workflow from tool output')
      return END
    }

    let target: string
    switch (state.intent) {
      case 'ORDER_MANAGEMENT':
        target = 'order_management'
        break
      case 'RESOLUTION_REFUND':
        target = 'resolution_refund'
        break
      case 'SUBSCRIPTION_RETENTION':
        target = 'subscription_retention'
        break
      case 'SALES_PRODUCT':
        target = 'sales_product'
        break
      default:
        // OTHER intent should also go back to sales_product to generate a response
        // NOT to END - that causes no response to be sent!
        target = 'sales_product'
    }

    log('Routing tool output back to:', target)
    return target
  }

  const workflow = new StateGraph(GraphState)
    // Add Nodes
    .addNode('router', routerNode)
    .addNode('order_management', orderManagementAgentNodeWithDebug)
    .addNode('resolution_refund', resolutionRefundAgentNodeWithDebug)
    .addNode('subscription_retention', subscriptionRetentionAgentNodeWithDebug)
    .addNode('sales_product', salesProductAgentNodeWithDebug)
    .addNode('tools', toolNodeWithEscalation)

    // Add Edges
    // 1. Start -> Router
    .addEdge(START, 'router')

    // 2. Router -> Specialist Agent OR End for escalated (Conditional)
    .addConditionalEdges('router', routeToAgent, [
      'order_management',
      'resolution_refund',
      'subscription_retention',
      'sales_product',
      END
    ])

    // 3. Specialist Agents -> Tools OR End (Conditional)
    .addConditionalEdges('order_management', shouldContinue, ['tools', END])
    .addConditionalEdges('resolution_refund', shouldContinue, ['tools', END])
    .addConditionalEdges('subscription_retention', shouldContinue, [
      'tools',
      END
    ])
    .addConditionalEdges('sales_product', shouldContinue, ['tools', END])

    // 4. Tools -> Return to the agent that called them
    .addConditionalEdges('tools', routeToolOutput, [
      'order_management',
      'resolution_refund',
      'subscription_retention',
      'sales_product',
      END
    ])

  log('Workflow graph compiled successfully')
  return workflow.compile({ checkpointer })
}

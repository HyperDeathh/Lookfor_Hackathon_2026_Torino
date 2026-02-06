'use client'
/* eslint-disable @next/next/no-img-element */

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Send,
  Box,
  RefreshCcw,
  ShieldCheck,
  ShoppingBag,
  ChevronRight,
  ChevronDown,
  Terminal,
  Loader2,
  CheckCircle2,
  User,
  Mail,
  Hash,
  Play,
  RotateCcw,
  Cpu,
  Workflow,
} from 'lucide-react'

/* ═══════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════ */

type AgentId = 'router' | 'order' | 'refund' | 'subscription' | 'sales'

interface AgentMeta {
  id: AgentId
  label: string
  name: string
  role: string
  accent: string
  icon: React.ElementType
  avatar: string
  thinkingText: string
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  text: string
  agentId?: AgentId
  ts: string
  widget?: {
    title: string
    status: 'loading' | 'done' | 'error'
  }
}

interface LogEntry {
  id: string
  ts: string
  agentId: AgentId
  kind: 'route' | 'think' | 'tool_call' | 'tool_output' | 'result' | 'error'
  title: string
  body?: string
  meta?: Record<string, unknown>
}

/* ═══════════════════════════════════════════════════
   AGENT CONFIG
   ═══════════════════════════════════════════════════ */

const AGENTS: Record<AgentId, AgentMeta> = {
  router: {
    id: 'router',
    label: 'Router',
    name: 'Eddie',
    role: 'Orchestrator',
    accent: '#64748b',
    icon: Workflow,
    avatar: '/avatars/gri-route.png',
    thinkingText: 'Eddie is analyzing your request…',
  },
  order: {
    id: 'order',
    label: 'Orders',
    name: 'Kate',
    role: 'Shipping & Tracking',
    accent: '#3b82f6',
    icon: Box,
    avatar: '/avatars/mavi-order.png',
    thinkingText: 'Kate is checking your shipment…',
  },
  refund: {
    id: 'refund',
    label: 'Refunds',
    name: 'Jack',
    role: 'Returns & Credits',
    accent: '#f59e0b',
    icon: ShieldCheck,
    avatar: '/avatars/turuncu-refund.png',
    thinkingText: 'Jack is reviewing your case…',
  },
  subscription: {
    id: 'subscription',
    label: 'Subscriptions',
    name: 'Quinn',
    role: 'Retention & Plans',
    accent: '#10b981',
    icon: RefreshCcw,
    avatar: '/avatars/yeşil-subscriction.png',
    thinkingText: 'Quinn is checking your plan…',
  },
  sales: {
    id: 'sales',
    label: 'Sales',
    name: 'Chris',
    role: 'Products & Advice',
    accent: '#8b5cf6',
    icon: ShoppingBag,
    avatar: '/avatars/mor-sales.png',
    thinkingText: 'Chris is finding recommendations…',
  },
}

const INTENT_TO_AGENT: Record<string, AgentId> = {
  ORDER_MANAGEMENT: 'order',
  RESOLUTION_REFUND: 'refund',
  SUBSCRIPTION_RETENTION: 'subscription',
  SALES_PRODUCT: 'sales',
  OTHER: 'router',
}

/* ═══════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════ */

const uid = () => Math.random().toString(36).slice(2, 10)
const now = () =>
  new Date().toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

/* ═══════════════════════════════════════════════════
   LOG CARD
   ═══════════════════════════════════════════════════ */

function LogCard({ entry }: { entry: LogEntry }) {
  const [open, setOpen] = useState(false)
  const agent = AGENTS[entry.agentId]

  const kindConfig: Record<string, { dot: string; tag: string }> = {
    route: { dot: 'bg-slate-400', tag: 'ROUTE' },
    think: { dot: 'bg-sky-400', tag: 'THINK' },
    tool_call: { dot: 'bg-violet-400', tag: 'TOOL' },
    tool_output: { dot: 'bg-emerald-400', tag: 'OUTPUT' },
    result: { dot: 'bg-green-400', tag: 'DONE' },
    error: { dot: 'bg-red-400', tag: 'ERROR' },
  }

  const kc = kindConfig[entry.kind] || kindConfig.think

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="mb-3"
    >
      <div className="bg-white/[0.04] rounded-lg border border-white/[0.06] p-3 hover:bg-white/[0.07] transition-colors">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1.5">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${kc.dot}`} />
          <img
            src={agent.avatar}
            alt=""
            className="w-4 h-4 rounded-full flex-shrink-0"
          />
          <span
            className="text-[11px] font-semibold"
            style={{ color: agent.accent }}
          >
            {agent.name}
          </span>
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">
            {kc.tag}
          </span>
          <span className="ml-auto text-[10px] font-mono text-slate-600 tabular-nums flex-shrink-0">
            {entry.ts}
          </span>
        </div>

        {/* Content */}
        <p className="text-[12px] text-slate-300 leading-relaxed pl-4">
          {entry.title}
        </p>

        {/* Expandable details */}
        {(entry.body || entry.meta) && (
          <>
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-1 mt-2 pl-4 text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
            >
              {open ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
              {open ? 'Hide details' : 'Show details'}
            </button>

            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 ml-4 p-2.5 rounded bg-black/30 font-mono text-[11px] leading-relaxed overflow-x-auto">
                    {entry.body && (
                      <pre className="text-slate-400 whitespace-pre-wrap">
                        {entry.body}
                      </pre>
                    )}
                    {entry.meta && (
                      <pre className="text-amber-400/80 whitespace-pre-wrap mt-1">
                        {JSON.stringify(entry.meta, null, 2)}
                      </pre>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════
   STAGE AVATAR  (Dormant → Passive → Active)
   ═══════════════════════════════════════════════════ */

function StageAvatar({
  agent,
  isActive,
  isThinking,
  isSessionActive,
}: {
  agent: AgentMeta
  isActive: boolean
  isThinking: boolean
  isSessionActive: boolean
}) {
  // 3 visual states
  const state = !isSessionActive
    ? 'dormant'
    : isActive
      ? 'active'
      : 'passive'

  return (
    <div
      className="relative flex flex-col items-center"
      style={{ width: '88px' }}
    >
      {/* ── SPOTLIGHT BEAM (3-layer) ── */}
      {state === 'active' && (
        <>
          {/* Layer 1 — Wide ambient glow */}
          <motion.div
            layoutId="spotlight-ambient"
            className="absolute -top-16 left-1/2 -translate-x-1/2 w-32 h-40 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at 50% 0%, ${agent.accent}15, transparent 70%)`,
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
          {/* Layer 2 — Main beam (conic trapezoid) */}
          <motion.div
            layoutId="spotlight-beam"
            className="absolute -top-14 left-1/2 -translate-x-1/2 w-28 h-36 pointer-events-none"
            style={{
              background: `conic-gradient(from 180deg at 50% 0%, transparent 30%, ${agent.accent}20 40%, ${agent.accent}30 50%, ${agent.accent}20 60%, transparent 70%)`,
              clipPath: 'polygon(35% 0%, 65% 0%, 100% 100%, 0% 100%)',
              filter: 'blur(2px)',
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
          {/* Layer 3 — Bright center core */}
          <motion.div
            layoutId="spotlight-core"
            className="absolute -top-12 left-1/2 -translate-x-1/2 w-16 h-32 pointer-events-none"
            style={{
              background: `linear-gradient(to bottom, ${agent.accent}25, ${agent.accent}10 60%, transparent)`,
              clipPath: 'polygon(40% 0%, 60% 0%, 85% 100%, 15% 100%)',
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        </>
      )}

      {/* ── AVATAR ── */}
      <motion.div
        className="relative"
        animate={{
          scale: state === 'active' ? 1.18 : state === 'passive' ? 0.9 : 0.8,
          y: state === 'active' ? -8 : 0,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      >
        {/* Pulse ring — faster heartbeat when thinking */}
        {state === 'active' && (
          <motion.div
            className="absolute inset-[-5px] rounded-full pointer-events-none"
            style={{ border: `2px solid ${agent.accent}` }}
            animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
            transition={{ duration: isThinking ? 0.8 : 1.8, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
        {/* Secondary pulse ring for thinking (double-ring heartbeat) */}
        {state === 'active' && isThinking && (
          <motion.div
            className="absolute inset-[-8px] rounded-full pointer-events-none"
            style={{ border: `1.5px solid ${agent.accent}` }}
            animate={{ scale: [1, 1.9], opacity: [0.3, 0] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: 'easeOut', delay: 0.3 }}
          />
        )}

        {/* Image */}
        <div
          className="w-16 h-16 rounded-full overflow-hidden transition-all duration-500"
          style={{
            borderWidth: '2.5px',
            borderStyle: 'solid',
            borderColor:
              state === 'active'
                ? agent.accent
                : state === 'passive'
                  ? '#e2e8f0'
                  : '#f1f5f9',
            filter:
              state === 'active' ? 'grayscale(0%)' : 'grayscale(100%)',
            opacity:
              state === 'dormant' ? 0.35 : state === 'passive' ? 0.55 : 1,
            boxShadow:
              state === 'active'
                ? `0 0 0 3px ${agent.accent}20, 0 0 24px ${agent.accent}25`
                : 'none',
          }}
        >
          <img
            src={agent.avatar}
            alt={agent.label}
            className="w-full h-full"
            draggable={false}
          />
        </div>

        {/* Status dot */}
        {state === 'active' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-100"
          >
            {isThinking ? (
              <Loader2
                className="w-3 h-3 animate-spin"
                style={{ color: agent.accent }}
              />
            ) : (
              <CheckCircle2
                className="w-3 h-3"
                style={{ color: agent.accent }}
              />
            )}
          </motion.div>
        )}
      </motion.div>

      {/* ── LABEL ── */}
      <div className="mt-2 text-center">
        <motion.p
          animate={{
            opacity:
              state === 'active' ? 1 : state === 'passive' ? 0.4 : 0.25,
          }}
          className="text-[11px] font-semibold tracking-tight leading-none"
          style={{ color: state === 'active' ? agent.accent : '#94a3b8' }}
        >
          {agent.name}
        </motion.p>

        <AnimatePresence>
          {state === 'active' && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 0.6, height: 14 }}
              exit={{ opacity: 0, height: 0 }}
              className="text-[9px] text-slate-400 mt-0.5 leading-tight"
            >
              {agent.role}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* ── SPEECH POINTER ── */}
      {state === 'active' && (
        <motion.div
          layoutId="speech-pointer"
          className="mt-2"
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        >
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: '7px solid transparent',
              borderRight: '7px solid transparent',
              borderTop: `7px solid ${agent.accent}`,
            }}
          />
        </motion.div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════ */

export default function Home() {
  /* ── Session ── */
  const [isActive, setIsActive] = useState(false)
  const [sessionId, setSessionId] = useState('')
  const [customerInfo, setCustomerInfo] = useState({
    email: 'jane.doe@example.com',
    firstName: 'Jane',
    lastName: 'Doe',
    shopifyId: 'cust_7f3a9b2c',
  })

  /* ── Chat ── */
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  /* ── Agents ── */
  const [activeAgent, setActiveAgent] = useState<AgentId>('router')
  const [thinkingAgent, setThinkingAgent] = useState<AgentId | null>(null)

  /* ── Logs ── */
  const [logs, setLogs] = useState<LogEntry[]>([])

  /* ── Refs ── */
  const chatEndRef = useRef<HTMLDivElement>(null)
  const logEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  /* ── Scroll only inside containers ── */
  const scrollChat = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [])
  const scrollLog = useCallback(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [])

  useEffect(() => { scrollChat() }, [messages, scrollChat])
  useEffect(() => { scrollLog() }, [logs, scrollLog])
  useEffect(() => {
    if (isActive) setTimeout(() => inputRef.current?.focus(), 200)
  }, [isActive])

  /* ── Helpers ── */
  const addLog = useCallback(
    (
      agentId: AgentId,
      kind: LogEntry['kind'],
      title: string,
      body?: string,
      meta?: Record<string, unknown>,
    ) => {
      setLogs((prev) => [
        ...prev,
        { id: uid(), ts: now(), agentId, kind, title, body, meta },
      ])
    },
    [],
  )

  const addMessage = useCallback(
    (role: ChatMessage['role'], text: string, agentId?: AgentId) => {
      setMessages((prev) => [
        ...prev,
        { id: uid(), role, text, agentId, ts: now() },
      ])
    },
    [],
  )

  /* ── Start Session ── */
  const startSession = () => {
    const sid = `ses_${uid()}`
    setSessionId(sid)
    setIsActive(true)
    setMessages([])
    setLogs([])
    setActiveAgent('router')
    addLog(
      'router',
      'route',
      'Session initialized',
      `${customerInfo.firstName} ${customerInfo.lastName} · ${customerInfo.email}`,
    )
    addMessage(
      'system',
      `Connected as ${customerInfo.firstName} ${customerInfo.lastName}. Your team is ready.`,
    )
  }

  /* ── Reset ── */
  const resetSession = () => {
    setIsActive(false)
    setSessionId('')
    setMessages([])
    setLogs([])
    setInputValue('')
    setActiveAgent('router')
    setThinkingAgent(null)
    setIsLoading(false)
  }

  /* ── Send (Streaming) ── */
  const sendMessage = async (overrideText?: string) => {
    const text = (overrideText || inputValue).trim()
    if (!text || isLoading || !isActive) return

    setInputValue('')

    // Optimistic user message
    const userMsgId = uid()
    // We add user message immediately
    setMessages(prev => [...prev, { id: userMsgId, role: 'user', text, ts: now() }])

    setIsLoading(true)
    setThinkingAgent('router') // Start thinking
    addLog('router', 'think', 'Classifying intent…')

    // Placeholder for assistant message (we'll update this as tokens arrive)
    const assistantMsgId = uid()
    // We don't add it yet, we wait for first token or final result
    // Actually, let's wait for first token to add "assistant" message block

    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          requestId: sessionId,
          customerInfo: {
            email: customerInfo.email,
            name: `${customerInfo.firstName} ${customerInfo.lastName}`,
          },
        }),
      })

      if (!res.body) throw new Error('No response body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let done = false
      let finalContent = ''
      let currentAgent: AgentId = 'router'

      // We will track if we added the assistant message yet
      let assistantMessageAdded = false
      let activeWidgetId: string | null = null

      while (!done) {
        const { value, done: doneReading } = await reader.read()
        done = doneReading
        if (value) {
          const chunk = decoder.decode(value, { stream: true })
          // Split by newline for NDJSON
          const lines = chunk.split('\n').filter(line => line.trim() !== '')

          for (const line of lines) {
            try {
              const event = JSON.parse(line)

              // Handle specific event types from LangGraph
              const eventType = event.event
              const eventName = event.name
              const eventData = event.data

              // --- 1. Router / Agent Detection ---
              // LangGraph node names: 'router', 'order_management', etc.
              // We map them to our IDs
              if (eventType === 'on_chain_start' && eventName) {
                if (eventName === 'order_management') { setActiveAgent('order'); currentAgent = 'order'; setThinkingAgent('order'); }
                else if (eventName === 'resolution_refund') { setActiveAgent('refund'); currentAgent = 'refund'; setThinkingAgent('refund'); }
                else if (eventName === 'subscription_retention') { setActiveAgent('subscription'); currentAgent = 'subscription'; setThinkingAgent('subscription'); }
                else if (eventName === 'sales_product') { setActiveAgent('sales'); currentAgent = 'sales'; setThinkingAgent('sales'); }

                // If router finishes, we might want to log it
                if (eventName === 'router') {
                  addLog('router', 'route', 'Intent classified')
                }
              }

              // --- 2. Tool Calls (Widgets + Logs) ---
              if (eventType === 'on_tool_start') {
                addLog(currentAgent, 'tool_call', `Executing ${eventName}...`, undefined, eventData.input)

                // Add In-Chat Widget
                const widgetId = uid()
                activeWidgetId = widgetId
                setMessages(prev => [...prev, {
                  id: widgetId,
                  role: 'assistant',
                  text: '',
                  agentId: currentAgent,
                  ts: now(),
                  widget: { title: `Running ${eventName}...`, status: 'loading' }
                }])
              }

              if (eventType === 'on_tool_end') {
                addLog(currentAgent, 'tool_output', `${eventName} finished`, JSON.stringify(eventData.output))

                // Update Widget to Done
                if (activeWidgetId) {
                  setMessages(prev => prev.map(m =>
                    m.id === activeWidgetId
                      ? { ...m, widget: { title: `Completed ${eventName}`, status: 'done' } }
                      : m
                  ))
                  activeWidgetId = null
                }
              }

              // --- 3. Token Streaming ---
              if (eventType === 'on_chat_model_stream') {
                // eventData.chunk.content is the token
                const token = eventData.chunk?.content || ''
                if (token) {
                  finalContent += token

                  if (!assistantMessageAdded) {
                    setMessages(prev => [...prev, { id: assistantMsgId, role: 'assistant', text: finalContent, agentId: currentAgent, ts: now() }])
                    assistantMessageAdded = true
                  } else {
                    // Update last message
                    setMessages(prev => {
                      // Ensure we don't overwrite a widget message if it was just added
                      // If the last message is a widget, we need to find the assistant message or add a new one?
                      // Actually, assistant message ID is stable. We update by ID.
                      return prev.map(m => m.id === assistantMsgId ? { ...m, text: finalContent, agentId: currentAgent } : m)
                    })
                  }
                }
              }

              // --- 4. Final Output from Workflow (if needed) ---
              // Usually the last 'on_chain_end' of the root graph has the final output.
              // But streaming tokens is better.

            } catch (e) {
              console.error('Error parsing JSON chunk', e)
            }
          }
        }
      }

      addLog(currentAgent, 'result', 'Response complete')

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      addLog('router', 'error', msg)
      addMessage('system', `⚠ ${msg}`)
    } finally {
      setIsLoading(false)
      setThinkingAgent(null)
    }
  }

  /* ── Suggestion chips ── */
  const suggestions = [
    { text: 'Where is my order #1001?', icon: Box, color: AGENTS.order.accent },
    { text: 'I want to cancel my subscription', icon: RefreshCcw, color: AGENTS.subscription.accent },
    { text: 'The product I received is damaged', icon: ShieldCheck, color: AGENTS.refund.accent },
    { text: 'Recommend something for sleep', icon: ShoppingBag, color: AGENTS.sales.accent },
  ]

  /* ─────────────────────────────────────────
     RENDER
     ───────────────────────────────────────── */

  return (
    <div className="flex h-dvh w-full overflow-hidden">
      {/* ══════════════════════════════════════
          LEFT — NEURAL FEED (dark glass)
          ══════════════════════════════════════ */}
      <aside className="hidden lg:flex w-[380px] flex-col bg-[#0c0e14] flex-shrink-0">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white/[0.08] flex items-center justify-center">
              <Cpu className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div>
              <h2 className="text-[13px] font-semibold text-slate-200 tracking-tight">
                Neural Feed
              </h2>
              <p className="text-[10px] text-slate-500">
                Real-time agent trace
              </p>
            </div>
          </div>

          {logs.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-[10px] font-bold text-emerald-400 tracking-wider">
                LIVE
              </span>
            </div>
          )}
        </div>

        {/* Scrollable log content */}
        <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0">
          {logs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-3">
              <Terminal className="w-8 h-8 text-slate-700 opacity-40" />
              <span className="text-[11px] text-slate-600">
                Waiting for activity…
              </span>
            </div>
          ) : (
            <>
              {logs.map((l) => (
                <LogCard key={l.id} entry={l} />
              ))}
              <div ref={logEndRef} />
            </>
          )}
        </div>
      </aside>

      {/* ══════════════════════════════════════
          RIGHT — THE STAGE + CHAT
          ══════════════════════════════════════ */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Subtle dot-pattern overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundImage:
              'radial-gradient(circle, #c8ccd4 0.6px, transparent 0.6px)',
            backgroundSize: '22px 22px',
            opacity: 0.22,
          }}
        />

        {/* Content wrapper (above the dots) */}
        <div className="relative z-10 flex flex-col h-full">
          {/* ── Top Bar ── */}
          <header className="flex items-center justify-between px-6 py-3 bg-white/80 backdrop-blur-sm border-b border-slate-200/60 flex-shrink-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                Torino
                <span className="text-emerald-500">.</span>
              </h1>
              <span className="text-[10px] text-slate-400 border-l border-slate-200 pl-2 font-medium hidden sm:inline">
                Multi-Agent Studio
              </span>
            </div>

            {isActive && (
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                  {sessionId}
                </span>
                <button
                  onClick={resetSession}
                  className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              </div>
            )}
          </header>

          {/* ── THE STAGE ── */}
          <section className="flex-shrink-0 pt-8 pb-2 px-4 relative">
            {/* Dormant curtain fade */}
            {!isActive && (
              <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#fafafa] to-transparent pointer-events-none z-20" />
            )}

            <div className="flex justify-center items-end gap-3 md:gap-6">
              {Object.values(AGENTS).map((a) => (
                <StageAvatar
                  key={a.id}
                  agent={a}
                  isActive={activeAgent === a.id}
                  isThinking={thinkingAgent === a.id}
                  isSessionActive={isActive}
                />
              ))}
            </div>
          </section>

          {/* ── Dynamic color bar ── */}
          <motion.div
            className="h-[2px] mx-6 rounded-full flex-shrink-0"
            animate={{
              backgroundColor: isActive
                ? AGENTS[activeAgent].accent
                : '#e2e8f0',
            }}
            transition={{ duration: 0.4 }}
          />

          {/* ── BELOW STAGE: form (idle) or chat (active) ── */}
          {!isActive ? (
            /* ─── IDLE: Session Setup ─── */
            <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto min-h-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm"
              >
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-slate-800 mb-1">
                    Your Team is Ready
                  </h2>
                  <p className="text-sm text-slate-500">
                    Enter customer details to activate the session.
                  </p>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3 shadow-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1 block">
                        First Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                        <input
                          type="text"
                          value={customerInfo.firstName}
                          onChange={(e) =>
                            setCustomerInfo((p) => ({
                              ...p,
                              firstName: e.target.value,
                            }))
                          }
                          className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 focus:bg-white transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1 block">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={customerInfo.lastName}
                        onChange={(e) =>
                          setCustomerInfo((p) => ({
                            ...p,
                            lastName: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1 block">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                      <input
                        type="email"
                        value={customerInfo.email}
                        onChange={(e) =>
                          setCustomerInfo((p) => ({
                            ...p,
                            email: e.target.value,
                          }))
                        }
                        className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1 block">
                      Shopify ID
                    </label>
                    <div className="relative">
                      <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                      <input
                        type="text"
                        value={customerInfo.shopifyId}
                        onChange={(e) =>
                          setCustomerInfo((p) => ({
                            ...p,
                            shopifyId: e.target.value,
                          }))
                        }
                        className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={startSession}
                  className="w-full mt-4 py-3 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10"
                >
                  <Play className="w-4 h-4" />
                  Activate Team
                </button>
              </motion.div>
            </div>
          ) : (
            /* ─── ACTIVE: Chat ─── */
            <>
              {/* Scrollable messages */}
              <div className="flex-1 overflow-y-auto min-h-0 px-6 py-5">
                <div className="max-w-2xl mx-auto space-y-4">
                  <AnimatePresence initial={false}>
                    {messages.map((msg) => {
                      if (msg.role === 'system') {
                        return (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex justify-center py-1"
                          >
                            <span className="text-[11px] text-slate-400 bg-white border border-slate-200 rounded-full px-4 py-1.5 font-medium">
                              {msg.text}
                            </span>
                          </motion.div>
                        )
                      }

                      const isUser = msg.role === 'user'
                      const agent = msg.agentId
                        ? AGENTS[msg.agentId]
                        : AGENTS.router

                      // --- Rich Content Parser ---
                      let richContent = null
                      if (!isUser) {
                        try {
                          const trimmed = msg.text.trim()
                          if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
                            const data = JSON.parse(trimmed)
                            if (data.type === 'product' && data.product) {
                              richContent = (
                                <div className="mt-2 mb-1 p-3 bg-white rounded-xl border border-slate-200 shadow-sm max-w-sm">
                                  <div className="aspect-square relative rounded-lg overflow-hidden bg-slate-100 mb-2">
                                    <img src={data.product.image || "/api/placeholder/400/400"} className="object-cover w-full h-full" alt={data.product.name} />
                                  </div>
                                  <h3 className="font-semibold text-slate-800 text-sm">{data.product.name}</h3>
                                  <p className="text-slate-500 text-xs mb-2 line-clamp-2">{data.product.description}</p>
                                  <div className="flex items-center justify-between mt-2">
                                    <span className="font-bold text-slate-900">{data.product.price}</span>
                                    <button className="text-[10px] bg-slate-900 text-white px-3 py-1.5 rounded-full font-medium hover:bg-slate-800">Add to Cart</button>
                                  </div>
                                </div>
                              )
                            } else if (data.type === 'order' && data.order) {
                              const steps = ['Confirmed', 'Processing', 'Shipped', 'Delivered']
                              const currentIdx = steps.indexOf(data.order.status) || 1
                              richContent = (
                                <div className="mt-2 mb-1 p-4 bg-white rounded-xl border border-slate-200 shadow-sm w-full">
                                  <div className="flex justify-between items-center mb-3">
                                    <div>
                                      <h3 className="font-semibold text-slate-800 text-sm">Order #{data.order.id}</h3>
                                      <p className="text-slate-500 text-[10px]">Expected: {data.order.eta}</p>
                                    </div>
                                    <div className="text-xs font-bold px-2 py-1 rounded bg-green-100 text-green-700">{data.order.status}</div>
                                  </div>

                                  <div className="relative h-1.5 bg-slate-100 rounded-full mb-4 overflow-hidden">
                                    <div className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-1000" style={{ width: `${(currentIdx / (steps.length - 1)) * 100}%` }}></div>
                                  </div>

                                  <div className="flex justify-between text-[9px] text-slate-400 font-medium uppercase tracking-wider">
                                    {steps.map(s => <span key={s} className={data.order.status === s ? 'text-blue-600 font-bold' : ''}>{s}</span>)}
                                  </div>
                                </div>
                              )
                            }
                          }
                        } catch (e) {
                          // Not JSON, ignore
                        }
                      }

                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25 }}
                          className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
                        >
                          {/* Agent avatar */}
                          {!isUser && (
                            <div className="flex-shrink-0 mt-5">
                              <div
                                className="w-8 h-8 rounded-full overflow-hidden border-2"
                                style={{
                                  borderColor: `${agent.accent}40`,
                                }}
                              >
                                <img
                                  src={agent.avatar}
                                  alt=""
                                  className="w-full h-full"
                                />
                              </div>
                            </div>
                          )}

                          {/* Bubble */}
                          <div
                            className={`max-w-[75%] ${isUser ? 'ml-auto' : ''}`}
                          >
                            {!isUser && (
                              <span
                                className="text-[10px] font-semibold uppercase tracking-wider ml-1 mb-1 block"
                                style={{ color: agent.accent }}
                              >
                                {agent.name} <span className="text-slate-300 mx-1">·</span> {agent.role}
                              </span>
                            )}

                            {/* --- WIDGET CARD (Live Data) --- */}
                            {msg.widget && (
                              <motion.div
                                className="mb-2 p-3 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center gap-3 overflow-hidden relative"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                              >
                                {msg.widget.status === 'loading' && (
                                  <div className="absolute top-0 left-0 h-0.5 bg-slate-100 w-full overflow-hidden">
                                    <div className="h-full bg-blue-500 w-1/3 animate-[shimmer_1s_infinite_linear]"></div>
                                  </div>
                                )}

                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.widget.status === 'done' ? 'bg-green-100 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                                  {msg.widget.status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-slate-700 truncate">{msg.widget.title}</p>
                                  <p className="text-[10px] text-slate-500">{msg.widget.status === 'loading' ? 'Processing...' : 'Completed'}</p>
                                </div>
                              </motion.div>
                            )}

                            <div
                              className={`px-4 py-3 text-[14px] leading-relaxed ${isUser
                                ? 'bg-slate-900 text-white rounded-2xl rounded-tr-sm'
                                : 'border text-slate-700 rounded-2xl rounded-tl-sm shadow-sm'
                                }`}
                              style={
                                !isUser
                                  ? {
                                    backgroundColor: `${agent.accent}08`,
                                    borderColor: `${agent.accent}20`,
                                  }
                                  : undefined
                              }
                            >
                              {isUser ? (
                                msg.text
                              ) : richContent ? (
                                richContent
                              ) : (
                                <div className="prose-agent">
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {msg.text}
                                  </ReactMarkdown>
                                </div>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-300 mt-1 block px-1">
                              {msg.ts}
                            </span>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                {/* Contextual typing indicator */}
                {thinkingAgent && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-3"
                  >
                    <div
                      className="w-8 h-8 rounded-full overflow-hidden border-2 flex-shrink-0"
                      style={{
                        borderColor: `${AGENTS[thinkingAgent].accent}40`,
                      }}
                    >
                      <img
                        src={AGENTS[thinkingAgent].avatar}
                        alt=""
                        className="w-full h-full"
                      />
                    </div>
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-2 shadow-sm">
                      <Loader2
                        className="w-3.5 h-3.5 animate-spin"
                        style={{ color: AGENTS[thinkingAgent].accent }}
                      />
                      <span className="text-[12px] text-slate-500">
                        {AGENTS[thinkingAgent].thinkingText}
                      </span>
                    </div>
                  </motion.div>
                )}

                <div ref={chatEndRef} />
              </div>
            </div>

          {/* Input area (fixed at bottom) */}
          <div className="flex-shrink-0 px-6 py-4 bg-white/80 backdrop-blur-sm border-t border-slate-200/60">
            <div className="max-w-2xl mx-auto">
              {/* Agent-colored suggestion chips */}
              {messages.length <= 1 && !isLoading && (
                <div className="flex gap-2 mb-3 flex-wrap">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(s.text)}
                      className="flex items-center gap-1.5 text-[11px] font-medium border rounded-full px-3 py-1.5 transition-all hover:shadow-md active:scale-95"
                      style={{
                        color: s.color,
                        borderColor: `${s.color}30`,
                        backgroundColor: `${s.color}08`,
                      }}
                    >
                      <s.icon className="w-3 h-3" />
                      {s.text}
                    </button>
                  ))}
                </div>
              )}

              {/* Magic Input Autocomplete */}
              {inputValue.endsWith('#') && (
                <div className="absolute bottom-full left-6 mb-2 bg-white border border-slate-200 rounded-xl shadow-lg p-2 min-w-[200px] animate-in slide-in-from-bottom-2 fade-in duration-200">
                  <p className="text-[9px] font-semibold text-slate-400 px-2 mb-1 uppercase tracking-wider">Recent Orders</p>
                  <button onClick={() => setInputValue(p => p + '1001 ')} className="block w-full text-left px-3 py-2 text-sm hover:bg-slate-50 rounded-lg transition-colors flex items-center justify-between group">
                    <span>Order #1001</span>
                    <span className="text-[10px] text-slate-400 group-hover:text-blue-500">Processing</span>
                  </button>
                  <button onClick={() => setInputValue(p => p + '1002 ')} className="block w-full text-left px-3 py-2 text-sm hover:bg-slate-50 rounded-lg transition-colors flex items-center justify-between group">
                    <span>Order #1002</span>
                    <span className="text-[10px] text-slate-400 group-hover:text-green-500">Delivered</span>
                  </button>
                </div>
              )}

              {inputValue.endsWith('/') && (
                <div className="absolute bottom-full left-6 mb-2 bg-white border border-slate-200 rounded-xl shadow-lg p-2 min-w-[200px] animate-in slide-in-from-bottom-2 fade-in duration-200">
                  <p className="text-[9px] font-semibold text-slate-400 px-2 mb-1 uppercase tracking-wider">System Commands</p>
                  <button onClick={() => { resetSession(); setInputValue('') }} className="block w-full text-left px-3 py-2 text-sm hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2 text-red-600">
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>/reset</span>
                  </button>
                  <button onClick={() => setInputValue('')} className="block w-full text-left px-3 py-2 text-sm hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2 text-slate-600">
                    <Terminal className="w-3.5 h-3.5" />
                    <span>/debug</span>
                  </button>
                </div>
              )}

              {/* Input field */}
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  sendMessage()
                }}
                className="flex items-center gap-3"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={isLoading}
                  placeholder={isLoading ? `${AGENTS[thinkingAgent || activeAgent].name} is thinking…` : 'Type your message…'}
                  className="flex-1 px-4 py-3 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 transition-all disabled:opacity-50 placeholder:text-slate-300"
                  style={{
                    borderColor: isLoading ? `${AGENTS[thinkingAgent || activeAgent].accent}40` : undefined,
                  }}
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isLoading}
                  className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex-shrink-0"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </form>
            </div>
          </div>
        </>
          )}
    </div>
      </main >
    </div >
  )
}

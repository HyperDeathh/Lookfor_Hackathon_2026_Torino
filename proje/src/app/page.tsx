'use client'
/* eslint-disable @next/next/no-img-element */

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
    role: 'Orchestrator',
    accent: '#64748b',
    icon: Workflow,
    avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Felix',
    thinkingText: 'Router is analyzing your request…',
  },
  order: {
    id: 'order',
    label: 'Orders',
    role: 'Shipping & Tracking',
    accent: '#3b82f6',
    icon: Box,
    avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Mia',
    thinkingText: 'Orders is checking your shipment…',
  },
  refund: {
    id: 'refund',
    label: 'Refunds',
    role: 'Returns & Credits',
    accent: '#f59e0b',
    icon: ShieldCheck,
    avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Leo',
    thinkingText: 'Refunds is reviewing your case…',
  },
  subscription: {
    id: 'subscription',
    label: 'Subscriptions',
    role: 'Retention & Plans',
    accent: '#10b981',
    icon: RefreshCcw,
    avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Zoe',
    thinkingText: 'Subscriptions is checking your plan…',
  },
  sales: {
    id: 'sales',
    label: 'Sales',
    role: 'Products & Advice',
    accent: '#8b5cf6',
    icon: ShoppingBag,
    avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Sam',
    thinkingText: 'Sales is finding recommendations…',
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
            {agent.label}
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
      {/* ── SPOTLIGHT BEAM ── */}
      {state === 'active' && (
        <motion.div
          layoutId="spotlight-beam"
          className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-28 pointer-events-none"
          style={{
            background: `linear-gradient(to bottom, ${agent.accent}18, ${agent.accent}08, transparent)`,
            clipPath: 'polygon(30% 0%, 70% 0%, 95% 100%, 5% 100%)',
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
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
        {/* Pulse ring */}
        {state === 'active' && (
          <motion.div
            className="absolute inset-[-5px] rounded-full pointer-events-none"
            style={{ border: `2px solid ${agent.accent}` }}
            animate={{ scale: [1, 1.6], opacity: [0.4, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
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
          {agent.label}
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

  /* ── Send (real API) ── */
  const sendMessage = async (overrideText?: string) => {
    const text = (overrideText || inputValue).trim()
    if (!text || isLoading || !isActive) return

    setInputValue('')
    addMessage('user', text)
    setIsLoading(true)
    setThinkingAgent('router')
    addLog('router', 'think', 'Classifying intent…')

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

      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'API error')

      const { data } = json
      const resolved = INTENT_TO_AGENT[data.intent] || 'router'

      // Log routing decision
      addLog('router', 'route', `Intent → ${data.intent}`)
      setActiveAgent(resolved)
      setThinkingAgent(resolved)

      // Process backend logs
      if (data.logs?.length) {
        for (const log of data.logs) {
          if (log.type === 'tool_call' && log.calls) {
            for (const call of log.calls) {
              addLog(resolved, 'tool_call', `${call.name}()`, undefined, call.args)
            }
          } else if (log.type === 'tool_output') {
            addLog(
              resolved,
              'tool_output',
              `${log.name} → response`,
              typeof log.content === 'string'
                ? log.content
                : JSON.stringify(log.content),
            )
          }
        }
      }

      addLog(resolved, 'result', 'Response generated')
      addMessage('assistant', data.response, resolved)
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
                Lookfor
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
                                {agent.label}
                              </span>
                            )}
                            <div
                              className={`px-4 py-3 text-[14px] leading-relaxed ${
                                isUser
                                  ? 'bg-slate-900 text-white rounded-2xl rounded-tr-sm'
                                  : 'bg-white border border-slate-200 text-slate-700 rounded-2xl rounded-tl-sm shadow-sm'
                              }`}
                            >
                              {msg.text}
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
                      placeholder="Type your message…"
                      className="flex-1 px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 transition-all disabled:opacity-50 placeholder:text-slate-300"
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
      </main>
    </div>
  )
}

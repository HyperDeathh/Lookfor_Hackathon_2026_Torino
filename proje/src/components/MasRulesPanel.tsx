'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, Plus, Trash2, X, ToggleLeft, ToggleRight, AlertCircle } from 'lucide-react'

interface MasRule {
  id: string
  rule: string
  createdAt: string
  isActive: boolean
}

export default function MasRulesPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [rules, setRules] = useState<MasRule[]>([])
  const [newRule, setNewRule] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRules = useCallback(async () => {
    try {
      const res = await fetch('/api/mas-rules')
      const data = await res.json()
      if (data.success) {
        setRules(data.data)
      }
    } catch (err) {
      console.error('Error fetching rules:', err)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      fetchRules()
    }
  }, [isOpen, fetchRules])

  const addRule = async () => {
    if (!newRule.trim()) return
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/mas-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rule: newRule.trim() })
      })
      const data = await res.json()
      if (data.success) {
        setRules(prev => [...prev, data.data])
        setNewRule('')
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to add rule')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const deleteRule = async (id: string) => {
    try {
      const res = await fetch('/api/mas-rules', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      const data = await res.json()
      if (data.success) {
        setRules(prev => prev.filter(r => r.id !== id))
      }
    } catch (err) {
      console.error('Error deleting rule:', err)
    }
  }

  const toggleRule = async (id: string) => {
    try {
      const res = await fetch('/api/mas-rules', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      const data = await res.json()
      if (data.success) {
        setRules(prev => prev.map(r => r.id === id ? data.data : r))
      }
    } catch (err) {
      console.error('Error toggling rule:', err)
    }
  }

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-[11px] font-medium text-slate-600 transition-colors"
        title="Dynamic MAS Rules"
      >
        <Settings className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">MAS Rules</span>
        {rules.filter(r => r.isActive).length > 0 && (
          <span className="ml-1 px-1.5 py-0.5 bg-emerald-500 text-white rounded-full text-[9px] font-bold">
            {rules.filter(r => r.isActive).length}
          </span>
        )}
      </button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-50"
            >
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mx-4">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-slate-800 to-slate-900">
                  <div>
                    <h2 className="text-white font-bold text-lg flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Dynamic MAS Rules
                    </h2>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Add rules to modify agent behavior in real-time
                    </p>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                {/* Add Rule Form */}
                <div className="p-4 border-b border-slate-100">
                  <div className="flex gap-2">
                    <textarea
                      value={newRule}
                      onChange={(e) => setNewRule(e.target.value)}
                      placeholder='e.g., "If a customer wants to update their order address, mark it as NEEDS_ATTENTION and escalate"'
                      className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 h-20"
                    />
                    <button
                      onClick={addRule}
                      disabled={isLoading || !newRule.trim()}
                      className="px-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </button>
                  </div>
                  {error && (
                    <div className="mt-2 flex items-center gap-1.5 text-red-500 text-xs">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {error}
                    </div>
                  )}
                </div>

                {/* Rules List */}
                <div className="max-h-80 overflow-y-auto">
                  {rules.length === 0 ? (
                    <div className="py-12 text-center text-slate-400">
                      <Settings className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No dynamic rules configured</p>
                      <p className="text-xs mt-1">Add a rule above to modify agent behavior</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {rules.map((rule) => (
                        <div
                          key={rule.id}
                          className={`p-4 transition-colors ${rule.isActive ? 'bg-white' : 'bg-slate-50'}`}
                        >
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() => toggleRule(rule.id)}
                              className="flex-shrink-0 mt-0.5"
                            >
                              {rule.isActive ? (
                                <ToggleRight className="w-6 h-6 text-emerald-500" />
                              ) : (
                                <ToggleLeft className="w-6 h-6 text-slate-300" />
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm leading-relaxed ${rule.isActive ? 'text-slate-700' : 'text-slate-400'}`}>
                                {rule.rule}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-1.5">
                                Added {new Date(rule.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <button
                              onClick={() => deleteRule(rule.id)}
                              className="flex-shrink-0 p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">
                  <p className="text-[10px] text-slate-500 text-center">
                    💡 Rules are applied with highest priority and affect all agents immediately
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

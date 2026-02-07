import fs from 'fs'
import path from 'path'

export interface MasRule {
  id: string
  rule: string
  createdAt: string
  isActive: boolean
}

interface MasRulesData {
  rules: MasRule[]
  updatedAt: string | null
}

const RULES_FILE_PATH = path.join(process.cwd(), 'src/lib/agents/mas-rules.json')

/**
 * Read all rules from the JSON file
 */
export function getRules(): MasRule[] {
  try {
    const data = fs.readFileSync(RULES_FILE_PATH, 'utf-8')
    const parsed: MasRulesData = JSON.parse(data)
    return parsed.rules || []
  } catch {
    return []
  }
}

/**
 * Get only active rules
 */
export function getActiveRules(): MasRule[] {
  return getRules().filter(r => r.isActive)
}

/**
 * Add a new rule
 */
export function addRule(ruleText: string): MasRule {
  const rules = getRules()
  
  const newRule: MasRule = {
    id: `rule_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    rule: ruleText,
    createdAt: new Date().toISOString(),
    isActive: true
  }
  
  rules.push(newRule)
  saveRules(rules)
  
  return newRule
}

/**
 * Delete a rule by ID
 */
export function deleteRule(id: string): boolean {
  const rules = getRules()
  const index = rules.findIndex(r => r.id === id)
  
  if (index === -1) return false
  
  rules.splice(index, 1)
  saveRules(rules)
  
  return true
}

/**
 * Toggle rule active status
 */
export function toggleRule(id: string): MasRule | null {
  const rules = getRules()
  const rule = rules.find(r => r.id === id)
  
  if (!rule) return null
  
  rule.isActive = !rule.isActive
  saveRules(rules)
  
  return rule
}

/**
 * Save rules to file
 */
function saveRules(rules: MasRule[]): void {
  const data: MasRulesData = {
    rules,
    updatedAt: new Date().toISOString()
  }
  
  fs.writeFileSync(RULES_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8')
}

/**
 * Get formatted rules string for injection into agent prompts
 * This is the main function used by agents
 */
export function getFormattedRulesForPrompt(): string {
  const activeRules = getActiveRules()
  
  if (activeRules.length === 0) {
    return 'No dynamic rules configured.'
  }
  
  return activeRules
    .map((r, i) => `${i + 1}. ${r.rule}`)
    .join('\n')
}

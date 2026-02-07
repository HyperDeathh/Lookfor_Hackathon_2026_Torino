import { NextRequest, NextResponse } from 'next/server'
import { getRules, addRule, deleteRule, toggleRule } from '@/lib/agents/masRulesManager'

/**
 * GET /api/mas-rules - Get all rules
 */
export async function GET() {
  try {
    const rules = getRules()
    return NextResponse.json({ 
      success: true, 
      data: rules 
    })
  } catch (error) {
    console.error('Error fetching MAS rules:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch rules' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/mas-rules - Add a new rule
 * Body: { rule: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { rule } = body

    if (!rule || typeof rule !== 'string' || rule.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Rule text is required' },
        { status: 400 }
      )
    }

    const newRule = addRule(rule.trim())
    
    console.log(`[MAS] New rule added: ${newRule.id} - "${rule.substring(0, 50)}..."`)
    
    return NextResponse.json({ 
      success: true, 
      data: newRule 
    })
  } catch (error) {
    console.error('Error adding MAS rule:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to add rule' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/mas-rules - Delete a rule
 * Body: { id: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { id } = body

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Rule ID is required' },
        { status: 400 }
      )
    }

    const success = deleteRule(id)
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Rule not found' },
        { status: 404 }
      )
    }

    console.log(`[MAS] Rule deleted: ${id}`)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Rule deleted' 
    })
  } catch (error) {
    console.error('Error deleting MAS rule:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete rule' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/mas-rules - Toggle rule active status
 * Body: { id: string }
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id } = body

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Rule ID is required' },
        { status: 400 }
      )
    }

    const updatedRule = toggleRule(id)
    
    if (!updatedRule) {
      return NextResponse.json(
        { success: false, error: 'Rule not found' },
        { status: 404 }
      )
    }

    console.log(`[MAS] Rule toggled: ${id} -> ${updatedRule.isActive ? 'active' : 'inactive'}`)
    
    return NextResponse.json({ 
      success: true, 
      data: updatedRule 
    })
  } catch (error) {
    console.error('Error toggling MAS rule:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to toggle rule' },
      { status: 500 }
    )
  }
}

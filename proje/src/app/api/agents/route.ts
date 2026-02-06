import { NextResponse } from 'next/server'
import { createWorkflow } from '../../../lib/agents/workflow'
import {
  HumanMessage,
  ToolMessage,
  AIMessage,
  BaseMessage
} from '@langchain/core/messages'
import { ConfigurationError } from '../../../lib/config/env'

import { MemorySaver } from '@langchain/langgraph'

// WARNING: MemorySaver loses state on server restart (or cold start in serverless).
// For production, use Postgres/Redis checkpointer.
const memory = new MemorySaver()

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { message, requestId, customerInfo } = body

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      )
    }

    // Pass the shared checkpointer
    const app = createWorkflow(memory)

    const threadId = requestId || Date.now().toString()

    const config = {
      recursionLimit: 100,
      configurable: {
        thread_id: threadId
      }
    }

    // Initialize state with customer info if provided
    // Note: With checkpointer, the state is loaded from memory if thread_id exists.
    // We only need to provide new messages.
    // If we want to UPDATE customerInfo mid-session, we can include it.
    const inputState = {
      messages: [new HumanMessage(message)],
      // Intent/customerInfo will be merged/overwritten if provided, or kept from history
      ...(customerInfo ? { customerInfo } : {})
    }

    // Run the graph
    // We use .invoke() to get the final state.
    // To stream logs in real-time would require .stream() and Server-Sent Events (SSE) or AI SDK streaming.
    // For now, we return the full execution log at the end.
    const result = await app.invoke(inputState, config)

    const lastMessage = result.messages[result.messages.length - 1]
    const content =
      typeof lastMessage.content === 'string'
        ? lastMessage.content
        : JSON.stringify(lastMessage.content)

    // Extract logs from message history (Tool calls and results)
    const executionLogs = result.messages
      .map((msg: BaseMessage) => {
        if (msg instanceof ToolMessage) {
          return {
            type: 'tool_output',
            name: msg.name,
            content: msg.content
          }
        }
        if (
          msg instanceof AIMessage &&
          msg.tool_calls &&
          msg.tool_calls.length > 0
        ) {
          return {
            type: 'tool_call',
            calls: msg.tool_calls
          }
        }
        return null
      })
      .filter(Boolean)

    return NextResponse.json({
      success: true,
      data: {
        response: content,
        intent: result.intent,
        threadId: config.configurable.thread_id,
        logs: executionLogs
      }
    })
  } catch (error) {
    console.error('Agent Error:', error)

    if (error instanceof ConfigurationError) {
      return NextResponse.json(
        {
          success: false,
          code: error.code,
          error: error.message,
          suggestion:
            'Lütfen proje ana dizinindeki .env.local dosyasını kontrol edin ve eksik anahtarları (örn: GROQ_API_KEY) ekleyin.'
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        code: 'INTERNAL_SERVER_ERROR',
        error:
          error instanceof Error
            ? (error.message.includes('Tool') || error.message.includes('Validation') || error.message.includes('Zod')
              ? 'Veri kaynağına erişirken teknik bir sorun yaşadım. Lütfen tekrar deneyin.'
              : error.message)
            : 'Bilinmeyen bir sunucu hatası oluştu.'
      },
      { status: 500 }
    )
  }
}

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

    const inputState = {
      messages: [new HumanMessage(message)],
      ...(customerInfo ? { customerInfo } : {})
    }

    // Create a streaming response
    const encoder = new TextEncoder()
    const customStream = new TransformStream({
      async transform(chunk, controller) {
        // Chunk is an event from streamEvents
        // We will format it as Server-Sent Events or just NDJSON
        // Let's use NDJSON for simplicity in the frontend parser
        const str = JSON.stringify(chunk) + '\n'
        controller.enqueue(encoder.encode(str))
      }
    })

    const writer = customStream.writable.getWriter()

      // Start streaming in the background (fire and forget from the request handler perspective, but keeps stream open)
      ; (async () => {
        try {
          const stream = await app.streamEvents(inputState, {
            ...config,
            version: 'v2'
          })

          for await (const event of stream) {
            await writer.write(event)
          }
        } catch (e: any) {
          console.error('Streaming Error:', e)
          const errorEvent = { event: 'error', data: e.message }
          await writer.write(errorEvent)
        } finally {
          await writer.close()
        }
      })()

    return new Response(customStream.readable, {
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
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

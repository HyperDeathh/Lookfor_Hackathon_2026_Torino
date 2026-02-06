import { z } from 'zod'

const serverEnvSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required.'),
  LANGGRAPH_TRACE: z.string().optional()
})

export const getServerEnv = () => {
  const parsed = serverEnvSchema.safeParse({
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    LANGGRAPH_TRACE: process.env.LANGGRAPH_TRACE
  })

  if (!parsed.success) {
    const message = parsed.error.issues.map(issue => issue.message).join(' ')
    throw new Error(message)
  }

  return parsed.data
}

import { z } from 'zod'

export class ConfigurationError extends Error {
  public code: string
  constructor(message: string, code: string) {
    super(message)
    this.name = 'ConfigurationError'
    this.code = code
  }
}

const serverEnvSchema = z.object({
  GROQ_API_KEY: z
    .string()
    .min(1, 'GROQ_API_KEY eksik. Lütfen geçerli bir key girin.'),
  LANGGRAPH_TRACE: z.string().optional()
})

export const getServerEnv = () => {
  const parsed = serverEnvSchema.safeParse({
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    LANGGRAPH_TRACE: process.env.LANGGRAPH_TRACE
  })

  if (!parsed.success) {
    // Hangi değişkenin eksik olduğunu bulalım
    const invalidFields = parsed.error.issues
      .map(issue => issue.path[0])
      .join(', ')

    throw new ConfigurationError(
      `Sunucu yapılandırma hatası: [${invalidFields}] eksik veya hatalı.`,
      'MISSING_ENV_VARIABLES'
    )
  }

  return parsed.data
}

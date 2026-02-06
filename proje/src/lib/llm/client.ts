import { ChatGroq } from '@langchain/groq'
import { getServerEnv } from '../config/env'

export const getLlm = () => {
  const { GROQ_API_KEY } = getServerEnv()

  return new ChatGroq({
    apiKey: GROQ_API_KEY,
    model: 'llama-3.3-70b-versatile',
    temperature: 0.2
  })
}

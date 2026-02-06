import { ChatOpenAI } from '@langchain/openai'
import { getServerEnv } from '../config/env'

export const getLlm = () => {
  const { OPENAI_API_KEY } = getServerEnv()

  return new ChatOpenAI({
    apiKey: OPENAI_API_KEY,
    model: 'gpt-4o-mini',
    temperature: 0.2
  })
}

import { getLangGraph } from '../langgraph'

export const createWorkflow = () => {
  const langgraph = getLangGraph()
  return { langgraph }
}

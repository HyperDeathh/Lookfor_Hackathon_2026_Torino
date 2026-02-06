import * as langgraph from '@langchain/langgraph'

export type LangGraphModule = typeof langgraph

export const getLangGraph = (): LangGraphModule => langgraph

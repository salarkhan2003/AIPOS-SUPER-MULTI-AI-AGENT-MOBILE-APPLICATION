/**
 * @deprecated All AI agent logic has moved to lib/agents.ts
 * This file re-exports for backwards compatibility only.
 */
export {
    agentChat, agentSimpleReply, formatAgentError, formatAgentError as formatGroqError, getAgentProviders, getGroqKey,
    getOpenRouterKey, agentChat as groqChat, agentSimpleReply as groqSimpleReply, groqWhisper, isAiConfigured, isAiConfigured as isGroqConfigured, parseAgentJson
} from '@/lib/agents';


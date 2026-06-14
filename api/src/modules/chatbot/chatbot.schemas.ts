import type { UIMessage } from 'ai';
import { z } from 'zod';
import { CHATBOT_MAX_MESSAGES } from './chatbot.constants';

const uiMessageSchema = z.custom<UIMessage>(
  (value) => {
    if (!value || typeof value !== 'object') return false;

    const message = value as Record<string, unknown>;
    const hasValidRole =
      message.role === 'system' || message.role === 'user' || message.role === 'assistant';
    const hasContent = Array.isArray(message.parts) || typeof message.content === 'string';

    return hasValidRole && hasContent;
  },
  { error: 'Tin nhắn không hợp lệ' },
);

export const chatbotRequestSchema = z.object({
  messages: z
    .array(uiMessageSchema)
    .min(1, { error: 'Cần ít nhất một tin nhắn' })
    .max(CHATBOT_MAX_MESSAGES, {
      error: `Chỉ hỗ trợ tối đa ${CHATBOT_MAX_MESSAGES} tin nhắn trong một lượt chat`,
    }),
}).passthrough();

export type ChatbotRequest = z.infer<typeof chatbotRequestSchema>;

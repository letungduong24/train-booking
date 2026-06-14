export const CHATBOT_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';
export const CHATBOT_MAX_MESSAGES = 50;

const CHATBOT_REASONING_FORMAT_MODELS = new Set([
  'qwen/qwen3-32b',
]);

export function supportsGroqReasoningFormat(model: string) {
  return CHATBOT_REASONING_FORMAT_MODELS.has(model);
}

export const CHATBOT_DATA_TOOL_NAMES = [
  'getMyBookings',
  'getWalletBalance',
  'getPassengerGroups',
  'getRoutes',
  'searchTrainTrips',
] as const;

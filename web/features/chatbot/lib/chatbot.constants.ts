export const CHATBOT_SUGGESTIONS = [
  "Tôi muốn đặt vé",
  "Xem vé đã đặt của tôi",
  "Số dư ví của tôi",
  "Các tuyến đường có sẵn",
  "Loại hành khách và giảm giá",
] as const;

export const CHATBOT_DATA_TOOL_TYPES = [
  "tool-searchTrainTrips",
  "tool-getMyBookings",
  "tool-getWalletBalance",
  "tool-getPassengerGroups",
  "tool-getRoutes",
] as const;

interface ChatPartLike {
  type: string;
  state?: string;
}

export function hasChatbotDataToolOutput(parts?: ChatPartLike[]) {
  return (
    parts?.some(
      (part) =>
        CHATBOT_DATA_TOOL_TYPES.includes(part.type as (typeof CHATBOT_DATA_TOOL_TYPES)[number]) &&
        part.state === "output-available",
    ) ?? false
  );
}

export function hasChatbotDataTool(parts?: ChatPartLike[]) {
  return (
    parts?.some((part) =>
      CHATBOT_DATA_TOOL_TYPES.includes(part.type as (typeof CHATBOT_DATA_TOOL_TYPES)[number]),
    ) ?? false
  );
}

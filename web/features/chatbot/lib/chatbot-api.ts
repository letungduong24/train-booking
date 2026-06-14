function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
}

export function getChatbotApiUrl() {
  const apiBaseUrl = getApiBaseUrl();
  return apiBaseUrl ? `${apiBaseUrl}/api/chat` : "/api/chat";
}

let refreshPromise: Promise<void> | null = null;

async function refreshChatbotSession() {
  const apiBaseUrl = getApiBaseUrl();
  const refreshUrl = apiBaseUrl ? `${apiBaseUrl}/auth/refresh` : "/auth/refresh";

  refreshPromise ??= fetch(refreshUrl, {
    method: "POST",
    credentials: "include",
  })
    .then(() => undefined)
    .catch(() => undefined)
    .finally(() => {
      refreshPromise = null;
    });

  await refreshPromise;
}

export async function fetchWithChatbotAuth(input: RequestInfo | URL, init?: RequestInit) {
  await refreshChatbotSession();
  return fetch(input, {
    ...init,
    credentials: "include",
  });
}

const API_BASE = "/api";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const message = await res.text().catch(() => `API error: ${res.status}`);
    throw new ApiError(res.status, message);
  }

  return res.json();
}

export const api = {
  main: () => request<{ name: string }>("/"),
  products: () => request<{ message: string }>("/products/"),
  discovery: () => request<{ message: string }>("/discovery/"),
  chat: () => request<{ message: string }>("/chat/"),
};

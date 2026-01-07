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

export interface DetectedObject {
  name: string;
  confidence: number;
  boundingPoly: {
    normalizedVertices: Array<{ x: number; y: number }>;
  };
}

export interface DetectedLabel {
  description: string;
  confidence: number;
}

export interface VisionAnalysisResponse {
  objects: DetectedObject[];
  labels: DetectedLabel[];
}

export interface NanoBananaResponse {
  generatedImage: string;
  mimeType: string;
  width?: number;
  height?: number;
}

export const api = {
  main: () => request<{ name: string }>("/"),
  products: () => request<{ message: string }>("/products/"),
  discovery: () => request<{ message: string }>("/discovery/"),
  chat: () => request<{ message: string }>("/chat/"),
  
  analyzeImage: async (file: File): Promise<VisionAnalysisResponse> => {
    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch(`${API_BASE}/vision/analyze`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const message = await res.text().catch(() => `API error: ${res.status}`);
      throw new ApiError(res.status, message);
    }

    return res.json();
  },

  generateImage: async (
    userImage: File,
    productImages: File[],
    prompt: string
  ): Promise<NanoBananaResponse> => {
    const formData = new FormData();
    formData.append("userImage", userImage);
    formData.append("productImage1", productImages[0]);
    
    if (productImages[1]) {
      formData.append("productImage2", productImages[1]);
    }
    
    formData.append("prompt", prompt);

    const res = await fetch(`${API_BASE}/nano-banana/generate`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const message = await res.text().catch(() => `API error: ${res.status}`);
      throw new ApiError(res.status, message);
    }

    return res.json();
  },
};

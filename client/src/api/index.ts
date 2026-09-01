const BASE_URL = import.meta.env.VITE_API_URL || "/api";

export const api = {
  get: async <T>(path: string): Promise<T> => {
    const res = await fetch(`${BASE_URL}${path}`);
    return res.json();
  },

  post: async <T>(path: string, data: unknown): Promise<T> => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  put: async <T>(path: string, data: unknown): Promise<T> => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  delete: async (path: string): Promise<void> => {
    await fetch(`${BASE_URL}${path}`, { method: "DELETE" });
  },

  uploadVideo: async (
    file: File,
  ): Promise<{ filename: string; url: string }> => {
    const formData = new FormData();
    formData.append("video", file);
    const res = await fetch(`${BASE_URL}/video/upload`, {
      method: "POST",
      body: formData,
    });
    return res.json();
  },

  uploadImage: async (
    file: File,
  ): Promise<{ filename: string; url: string }> => {
    const formData = new FormData();
    formData.append("image", file);
    const res = await fetch(`${BASE_URL}/image/upload`, {
      method: "POST",
      body: formData,
    });
    return res.json();
  },
};

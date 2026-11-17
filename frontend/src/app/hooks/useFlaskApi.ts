import { useCallback } from "react";
import { ACCESS_CODE_KEY } from "../settings/settings.defaults";

function accessCode(): string {
  try {
    return localStorage.getItem(ACCESS_CODE_KEY) || "";
  } catch {
    return "";
  }
}

/** Typed, minimal wrapper over the existing Flask endpoints. */
export function useFlaskApi() {
  const get = useCallback(async <T,>(path: string): Promise<T> => {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Request failed: ${path}`);
    return (await response.json()) as T;
  }, []);

  const post = useCallback(async <T,>(
    path: string,
    body: Record<string, unknown> = {},
  ): Promise<T> => {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, access_code: accessCode() }),
    });
    const data = (await response.json().catch(() => ({}))) as T & {
      code_required?: boolean;
      error?: string;
    };
    if (!response.ok) {
      const error = new Error(data.error || `Request failed: ${path}`);
      if (data.code_required) error.name = "AccessCodeRequired";
      throw error;
    }
    return data;
  }, []);

  return { get, post };
}

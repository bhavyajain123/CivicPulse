
import { auth } from "../firebase";

const BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000/api/v1";

export async function api<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  let savedUser: { token?: string } | null = null;

  try {
    savedUser = JSON.parse(
      localStorage.getItem("civicconnect-user") || "null"
    );
  } catch {
    savedUser = null;
  }

  const headers = new Headers(init.headers);

  const isFormData =
    typeof FormData !== "undefined" &&
    init.body instanceof FormData;

  if (
    init.body &&
    !isFormData &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  if (!headers.has("Authorization")) {
    let token: string | undefined;

    if (auth.currentUser) {
      token = await auth.currentUser.getIdToken();
    } else {
     
      token = savedUser?.token;
    }

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(BASE + path, {
    ...init,
    headers
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      result?.message || `Request failed: ${response.status}`
    );
  }

  return result as T;
}

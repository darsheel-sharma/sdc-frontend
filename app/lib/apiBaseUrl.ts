const FALLBACK_API_BASE_URL = "https://sdc-backend-evck.onrender.com";

export function getApiBaseUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL?.trim();
  return fromEnv && fromEnv.length > 0 ? fromEnv : FALLBACK_API_BASE_URL;
}

export function isLocalDevAuthBypassEnabled() {
  if (process.env.NODE_ENV === "production") {
    return false; //i have just added to change the frontend when i dont have auth
  }

  if (typeof window === "undefined") {
    return false;
  }

  const localhostHosts = new Set(["localhost", "127.0.0.1", "::1"]);
  return localhostHosts.has(window.location.hostname);
}

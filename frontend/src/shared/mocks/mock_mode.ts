export function isMockMode() {
  return import.meta.env.VITE_DATA_MODE !== "api";
}

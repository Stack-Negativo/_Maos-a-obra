export function isMockMode() {
  return import.meta.env.VITE_DATA_MODE !== "api";
}

export const MOCK_MODE_LABEL = "Dados mockados";

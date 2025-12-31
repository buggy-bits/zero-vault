export const ENV = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  API_VERSION: import.meta.env.VITE_API_VERSION,
  APP_NAME: import.meta.env.VITE_APP_NAME,
  ENVIRONMENT: import.meta.env.VITE_ENVIRONMENT,
  MOCKAPI_BASE: import.meta.env.VITE_MOCKAPI_BASE,
} as const;

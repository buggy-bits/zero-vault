export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/v1/auth/login",
    GUEST_LOGIN: "/api/v1/auth/iamguest",
    REGISTER: "/api/v1/auth/register",
    REFRESH: "/api/v1/token/refresh",
  },
  PROJECTS: "/api/v1/projects",
  ENDPOINTS: "/api/v1/endpoints",
  RESOURCES: "/api/v1/resources",
} as const;

export const ROUTES = {
  HOME: "/",
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  PROJECTS: "/projects",
  PROJECT_DETAIL: "/projects/:projectId",
} as const;

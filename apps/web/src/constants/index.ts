export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/v1/auth/login",
    GUEST_LOGIN: "/api/v1/auth/iamguest",
    REGISTER: "/api/v1/auth/register",
    REFRESH: "/api/v1/auth/token/refresh",
    ME: "/api/v1/auth/me",
    LOGOUT: "/api/v1/auth/logout",
  },
  NOTE: {
    CREATE: "/api/v1/notes",
    GET_ALL: "/api/v1/notes",
  },
  USER: {
    PUBLIC_KEY: "/api/v1/user/public-key",
  },
  FILES: {
    UPLOAD: "/api/v1/files/upload",
    DOWNLOAD: "/api/v1/files/download",
    LIST: "/api/v1/notes/files",
    DELETE: "/api/v1/files",
  },
  SHARE: {
    FILE: "/api/v1/share/file",
    NOTE: "/api/v1/share/note",
    DOWNLOAD: "/api/v1/share/download",
  },
  METADATA: {
    FILE: "/api/v1/notes/metadata/file",
    SHARE: "/api/v1/notes/metadata/share",
    NOTE_SHARE: "/api/v1/notes/metadata/notes/share",
  },
  OAUTH: {
    GOOGLE_START: "/api/v1/oauth/google/start",
    STATUS: "/api/v1/oauth/google/status",
  },
} as const;

export const ROUTES = {
  HOME: "/",
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  CREATE: "/create",
  SHARE: "/share",
  INBOX: "/inbox",
  UPLOAD: "/upload",
  MY_FILES: "/myfiles",
  FILES: "/files",
  SETTINGS: "/settings",
} as const;

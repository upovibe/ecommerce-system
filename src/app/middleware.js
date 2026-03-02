/**
 * Basic Middleware for E-commerce System
 */
export default {
  login: {
    redirectIfAuth: true,
    redirectTo: "/admin",
  },
  admin: {
    requireAuth: true,
    requireRole: "admin",
    redirectTo: "/login",
  },
  "*": {
    requireAuth: false,
    logAccess: false,
  },
};

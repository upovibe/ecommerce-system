/**
 * Basic Middleware for E-commerce System
 */
export default {
  login: {
    redirectIfAuth: true,
    redirectTo: (user) =>
      user?.user_type === "admin" ? "/dashboard/admin" : "/profile",
  },
  "dashboard/admin": {
    requireAuth: true,
    requireRole: "admin",
    redirectTo: "/login",
  },
  profile: {
    requireAuth: true,
    redirectTo: "/login",
  },
  "*": {
    requireAuth: false,
    logAccess: false,
  },
};

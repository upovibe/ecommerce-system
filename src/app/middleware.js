/**
 * Basic Middleware for E-commerce System
 */
export default {
  auth: {
    requireAuth: false,
    redirectIfAuth: true,
    redirectTo: (user) =>
      user?.user_type === "admin" ? "/dashboard/admin" : "/profile",
  },
  "auth/forgot-password": {
    requireAuth: false,
  },
  "dashboard/admin": {
    requireAuth: true,
    requireRole: ["super_admin", "manager", "accountant", "admin", "staff"],
    redirectTo: "/auth/login",
  },
  profile: {
    requireAuth: true,
    redirectTo: "/auth/customer-login",
  },
  public: {
    requireAuth: false,
    logAccess: false,
  },
  "*": {
    requireAuth: false,
    logAccess: false,
    redirectTo: () => null,
  },
};

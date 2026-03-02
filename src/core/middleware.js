/**
 * 🔧 Core Middleware System
 * 
 * This is the core middleware system that provides the framework
 * for authentication, route protection, and middleware execution.
 * 
 * IMPORTANT: Don't modify this file - it's the core system.
 * Use /src/app/middleware.js for custom configurations.
 */

import pageMiddlewareConfig from '../app/middleware.js';

class Middleware {
    constructor() {
        this.middlewares = new Map();
        this.protectedRoutes = new Set();
        this.publicRoutes = new Set();
    }

    /**
     * Register a middleware function
     * @param {string} name - Middleware name
     * @param {function} fn - Middleware function
     */
    register(name, fn) {
        this.middlewares.set(name, fn);
    }

    /**
     * Add a protected route (requires authentication)
     * @param {string} route - Route path
     */
    protectRoute(route) {
        this.protectedRoutes.add(route);
    }

    /**
     * Add a public route (no authentication required)
     * @param {string} route - Route path
     */
    addPublicRoute(route) {
        this.publicRoutes.add(route);
    }

    /**
     * Check if user is authenticated
     * @returns {boolean} True if authenticated
     */
    isAuthenticated() {
        const userData = localStorage.getItem('userData');
        const token = localStorage.getItem('token');
        
        if (!userData || !token) {
            return false;
        }

        try {
            const user = JSON.parse(userData);
            return user && user.id && user.role;
        } catch (error) {
            console.error('Error parsing user data:', error);
            // Clear invalid data
            localStorage.removeItem('userData');
            localStorage.removeItem('token');
            return false;
        }
    }

    /**
     * Get current user data
     * @returns {object|null} User data or null if not authenticated
     */
    getCurrentUser() {
        if (!this.isAuthenticated()) {
            return null;
        }

        try {
            return JSON.parse(localStorage.getItem('userData'));
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    }

    /**
     * Check if user has required role
     * @param {string} requiredRole - Required role
     * @returns {boolean} True if user has required role
     */
    hasRole(requiredRole) {
        const user = this.getCurrentUser();
        return user && user.role === requiredRole;
    }

    /**
     * Check if user has any of the required roles
     * @param {string[]} requiredRoles - Array of required roles
     * @returns {boolean} True if user has any of the required roles
     */
    hasAnyRole(requiredRoles) {
        const user = this.getCurrentUser();
        return user && requiredRoles.includes(user.role);
    }

    /**
     * Execute middleware chain for a route
     * @param {string} path - Current route path
     * @param {object} context - Additional context
     * @returns {object} Result with success, redirect, or error
     */
    async execute(path, context = {}) {
        // Get page path without leading slash
        const pagePath = path.replace(/^\//, '');
        
        // Smart middleware: Check both page-specific and layout-specific rules
        const pageConfig = this.getSmartMiddlewareConfig(pagePath);
        
        // Add layout information to context
        context.layout = this.detectLayout(pagePath);
        context.pagePath = pagePath;

        // Check authentication requirement
        if (pageConfig.requireAuth && !this.isAuthenticated()) {
            return {
                success: false,
                redirect: '/auth/login',
                reason: 'Authentication required'
            };
        }

        // Check role requirement
        if (pageConfig.requireRole) {
            const user = this.getCurrentUser();
            if (!user || user.role !== pageConfig.requireRole) {
                // Handle dynamic redirect functions
                let redirectPath = '/dashboard';
                if (typeof pageConfig.redirectTo === 'function') {
                    redirectPath = pageConfig.redirectTo(user) || '/dashboard';
                } else {
                    redirectPath = pageConfig.redirectTo || '/dashboard';
                }
                
                return {
                    success: false,
                    redirect: redirectPath,
                    reason: `${pageConfig.requireRole} access required`
                };
            }
        }

        // Check if authenticated users should be redirected (for auth pages)
        if (pageConfig.redirectIfAuth && this.isAuthenticated()) {
            const user = this.getCurrentUser();
            
            // Handle dynamic redirect functions
            let redirectPath = '/';
            if (typeof pageConfig.redirectTo === 'function') {
                redirectPath = pageConfig.redirectTo(user) || '/';
            } else {
                redirectPath = pageConfig.redirectTo || '/';
            }
            
            return {
                success: false,
                redirect: redirectPath,
                reason: 'User already authenticated'
            };
        }

        // Check time restrictions
        if (pageConfig.timeRestriction) {
            const currentHour = new Date().getHours();
            const { startHour, endHour, message } = pageConfig.timeRestriction;
            
            if (currentHour < startHour || currentHour > endHour) {
                return {
                    success: false,
                    redirect: '/maintenance',
                    reason: message
                };
            }
        }

        // Check role restrictions (completely flexible)
        const user = this.getCurrentUser();
        if (user && pageConfig.restrictRoles) {
            const restrictedRoles = Array.isArray(pageConfig.restrictRoles) 
                ? pageConfig.restrictRoles 
                : [pageConfig.restrictRoles];
            
            if (restrictedRoles.includes(user.role)) {
                // Handle dynamic redirect functions
                let redirectPath = '/dashboard';
                if (typeof pageConfig.redirectTo === 'function') {
                    redirectPath = pageConfig.redirectTo(user) || '/dashboard';
                } else {
                    redirectPath = pageConfig.restrictRedirect || pageConfig.redirectTo || '/dashboard';
                }
                
                return {
                    success: false,
                    redirect: redirectPath,
                    reason: pageConfig.restrictReason || 'Access restricted for your role'
                };
            }
        }

        // Log access if configured
        if (pageConfig.logAccess) {
            const user = this.getCurrentUser();
            const timestamp = new Date().toISOString();
        }

        // Execute custom middlewares
        for (const [name, middleware] of this.middlewares) {
            try {
                const result = await middleware(path, context);
                
                if (result && result.success === false) {
                    console.log(`❌ Middleware ${name} blocked access:`, result.reason);
                    return result;
                }
            } catch (error) {
                console.error(`❌ Middleware ${name} error:`, error);
                return {
                    success: false,
                    redirect: '/dashboard',
                    reason: `Middleware error: ${error.message}`
                };
            }
        }

        return { success: true };
    }

    /**
     * Check if a route is protected
     * @param {string} path - Route path
     * @returns {boolean} True if route is protected
     */
    isProtectedRoute(path) {
        const pagePath = path.replace(/^\//, '');
        const pageConfig = pageMiddlewareConfig[pagePath];
        
        if (pageConfig) {
            return pageConfig.requireAuth || false;
        }

        // Fallback to pattern matching
        for (const protectedRoute of this.protectedRoutes) {
            if (this.matchesPattern(path, protectedRoute)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if path matches a pattern (supports wildcards)
     * @param {string} path - Actual path
     * @param {string} pattern - Pattern to match against
     * @returns {boolean} True if path matches pattern
     */
    matchesPattern(path, pattern) {
        // Convert pattern to regex
        const regexStr = pattern
            .replace(/\//g, '\\/')
            .replace(/\*/g, '.*')
            .replace(/\[.*?\]/g, '[^/]+');
        
        const regex = new RegExp(`^${regexStr}$`);
        return regex.test(path);
    }

    /**
     * Detect which layout should be used for a page
     * @param {string} pagePath - Page path
     * @returns {string} Layout name
     */
    detectLayout(pagePath) {
        // Auth pages use auth layout
        if (pagePath.startsWith('auth/')) {
            return 'auth';
        }
        
        // Dashboard pages use dashboard layout
        if (pagePath.startsWith('dashboard/')) {
            return 'dashboard';
        }
        
        // Profile and settings might use custom layout
        if (pagePath === 'profile' || pagePath === 'settings') {
            return 'custom';
        }
        
        // Error pages use minimal layout
        if (pagePath === '404' || pagePath === 'maintenance' || pagePath === 'error') {
            return 'minimal';
        }
        
        // Default to root layout
        return 'root';
    }

    /**
     * Smart middleware configuration that checks both page and layout rules
     * @param {string} pagePath - Page path
     * @returns {object} Combined middleware configuration
     */
    getSmartMiddlewareConfig(pagePath) {
        // Get page-specific configuration
        const pageConfig = pageMiddlewareConfig[pagePath] || {};
        
        // Get layout for this page
        const layout = this.detectLayout(pagePath);
        
        // Get layout-based rules from middleware config
        const layoutConfig = pageMiddlewareConfig[layout] || {};
        
        // Get system layout rules as fallback
        const systemLayoutRules = this.getLayoutRules(layout);
        
        // Get wildcard configuration for unknown pages
        const wildcardConfig = pageMiddlewareConfig['*'] || {};
        
        // Combine rules with priority: page > layout > wildcard > system
        const combinedConfig = {
            // System defaults
            requireAuth: false,
            logAccess: false,
            notifyOnAccess: false,
            
            // Apply system layout rules first
            ...systemLayoutRules,
            
            // Apply wildcard rules for unknown pages
            ...wildcardConfig,
            
            // Apply layout-based rules from config
            ...layoutConfig,
            
            // Apply page-specific rules (highest priority)
            ...pageConfig
        };
        

        
        return combinedConfig;
    }

    /**
     * Get layout-specific middleware rules
     * @param {string} layout - Layout name
     * @returns {object} Layout-specific rules
     */
    getLayoutRules(layout) {
        const layoutRules = {
            'auth': {
                allowUnauthenticated: true,
                redirectAuthenticated: true,
                requireAuth: false,
                logAccess: false
            },
            'dashboard': {
                requireAuthentication: true,
                requireAuth: true,
                logAccess: true,
                notifyOnAccess: false
            },
            'custom': {
                requireAuthentication: true,
                requireAuth: true,
                logAccess: true,
                notifyOnAccess: false
            },
            'minimal': {
                allowUnauthenticated: true,
                requireAuth: false,
                logAccess: false,
                notifyOnAccess: false
            },
            'root': {
                allowUnauthenticated: true,
                requireAuth: false,
                logAccess: false,
                notifyOnAccess: false
            }
        };
        
        return layoutRules[layout] || layoutRules.root;
    }

    /**
     * Logout user and clear authentication data
     */
    logout() {
        localStorage.removeItem('userData');
        localStorage.removeItem('token');
    }
}

/**
 * 🔧 HELPER FUNCTIONS
 * 
 * Helper functions for middleware logic.
 */

// Get middleware config for a specific page
function getPageMiddleware(pagePath) {
    return pageMiddlewareConfig[pagePath] || {
        requireAuth: false,
        logAccess: false
    };
}

// Check if page requires authentication
function requiresAuth(pagePath) {
    const config = getPageMiddleware(pagePath);
    return config.requireAuth || false;
}

// Check if page requires specific role
function requiresRole(pagePath) {
    const config = getPageMiddleware(pagePath);
    return config.requireRole || null;
}

// Check if page should redirect authenticated users
function shouldRedirectIfAuth(pagePath) {
    const config = getPageMiddleware(pagePath);
    return config.redirectIfAuth || false;
}

// Check if page has time restrictions
function hasTimeRestriction(pagePath) {
    const config = getPageMiddleware(pagePath);
    return config.timeRestriction || null;
}

// Check if page should log access
function shouldLogAccess(pagePath) {
    const config = getPageMiddleware(pagePath);
    return config.logAccess || false;
}

// Check if page should notify on access
function shouldNotifyOnAccess(pagePath) {
    const config = getPageMiddleware(pagePath);
    return config.notifyOnAccess || false;
}

// Check if page restricts specific roles
function getRoleRestrictions(pagePath) {
    const config = getPageMiddleware(pagePath);
    return config.restrictRoles || [];
}

/**
 * 📝 CUSTOM MIDDLEWARE TEMPLATES
 * 
 * Templates for creating custom middleware functions.
 */

// Template: Custom role restriction
function createRoleRestriction(allowedRoles, redirectPath = '/404') {
    return (user) => {
        if (!user) return { success: false, redirect: '/auth/login', reason: 'Authentication required' };
        if (!allowedRoles.includes(user.role)) {
            return { success: false, redirect: redirectPath, reason: 'Insufficient permissions' };
        }
        return { success: true };
    };
}

// Template: Time-based restriction
function createTimeRestriction(startHour, endHour, redirectPath = '/maintenance') {
    return () => {
        const currentHour = new Date().getHours();
        if (currentHour < startHour || currentHour > endHour) {
            return { 
                success: false, 
                redirect: redirectPath, 
                reason: `Access restricted between ${startHour}:00 and ${endHour}:00` 
            };
        }
        return { success: true };
    };
}

// Template: Custom access check
function createCustomAccessCheck(condition, redirectPath, reason) {
    return (context) => {
        if (condition(context)) {
            return { success: false, redirect: redirectPath, reason };
        }
        return { success: true };
    };
}

// Create and export singleton instance
const middleware = new Middleware();

export default middleware; 
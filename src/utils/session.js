/**
 * @module utils/session
 * 
 * Handles session state management, ensuring that authentication data is cleared
 * when a user opens a new tab or browser window.
 */

/**
 * Clear all authentication-related data from localStorage.
 * This is called when a new session (tab/window) is detected.
 */
function clearAuthStorage() {
    try {
        console.log('🔄 Clearing authentication data from localStorage...');
        
        // Clear all authentication-related data
        localStorage.removeItem('userData');
        localStorage.removeItem('token');
        localStorage.removeItem('requiresPasswordChange');
        
        // Clear any other session-related data that might exist
        localStorage.removeItem('lastActivity');
        localStorage.removeItem('sessionStart');
        localStorage.removeItem('rememberMe');
        
        console.log('✅ Authentication data cleared.');
    } catch (error) {
        console.error('❌ Error clearing localStorage:', error);
    }
}

/**
 * Checks if a session is active using sessionStorage. If not, it clears
 * any lingering authentication data from localStorage. This ensures
 * that a new tab or browser window always starts with a clean slate.
 */
function handleSessionState() {
    // If 'session_active' is not 'true', it means this is a new tab/window.
    if (sessionStorage.getItem('session_active') !== 'true') {
        console.log('🚪 New session detected (tab/browser opened). Clearing auth data.');
        clearAuthStorage();
    } else {
        console.log('✅ Session active.');
    }
}

// Run the session check as soon as this module is imported.
try {
    console.log('🚀 Initializing session state handler...');
    handleSessionState();
    console.log('✅ Session state handler initialized.');
} catch (error) {
    console.error('❌ Error initializing session state handler:', error);
}

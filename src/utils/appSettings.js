import api from '@/services/api.js';

/**
 * Application Name Utility
 * 
 * Simple utility for getting and using the application name
 */

/**
 * Get application name from settings
 * @returns {Promise<string>} The application name or default value
 */
export async function getApplicationName() {
    try {
        const response = await api.get('/settings/key/application_name');
        if (response.data.success && response.data.data) {
            return response.data.data.setting_value;
        }
    } catch (error) {
        console.error('Error fetching application name:', error);
    }
    return 'Church System'; // Default fallback
}

/**
 * Set document title using application name
 * @param {string} pageName - Optional page name to append
 * @returns {Promise<void>}
 */
export async function setDocumentTitle(pageName = '') {
    try {
        const appName = await getApplicationName();
        if (pageName) {
            document.title = `${appName} - ${pageName}`;
        } else {
            document.title = appName;
        }
    } catch (error) {
        console.error('Error setting document title:', error);
        document.title = pageName || 'Church System';
    }
} 
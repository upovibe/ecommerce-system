/**
 * UPO UI - API Client
 * 
 * This module centralizes all API communication for the application.
 * It uses Axios for making HTTP requests.
 * 
 * Features:
 * - Pre-configured base URL for the Lumen API.
 * - Easy-to-use methods for GET, POST, etc.
 * - A helper for making authenticated requests with a bearer token.
 * - Centralized error handling (can be expanded later).
 */

const API_BASE_URL = '/api'; // Use relative path for flexibility in different environments

// Create a pre-configured instance of axios
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000, // 10 second timeout
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Helper function to handle 401 errors
function handle401Error() {
    // Clear authentication data immediately
    try {
        localStorage.removeItem('userData');
        localStorage.removeItem('token');
        localStorage.removeItem('requiresPasswordChange');
        localStorage.removeItem('lastActivity');
        localStorage.removeItem('sessionStart');
        localStorage.removeItem('rememberMe');
        sessionStorage.removeItem('session_active');
    } catch (error) {
        console.error('Error clearing auth storage:', error);
    }
    
    // Set flag to prevent further rendering
    sessionStorage.setItem('auth_redirecting', 'true');
    
    // Use replace instead of href to prevent back button issues
    // This is more immediate than router navigation
    window.location.replace('/auth/login');
}

// --- API Methods ---

const api = {
    /**
     * Performs a GET request.
     * @param {string} endpoint - The API endpoint to call (e.g., '/users').
     * @param {object} [params] - Optional query parameters.
     * @returns {Promise<axios.AxiosResponse<any>>}
     */
    get: (endpoint, params = {}) => {
        return apiClient.get(endpoint, { params });
    },

    /**
     * Performs a POST request.
     * @param {string} endpoint - The API endpoint to call.
     * @param {object} data - The data to send in the request body.
     * @returns {Promise<axios.AxiosResponse<any>>}
     */
    post: (endpoint, data) => {
        // Handle FormData for multipart requests
        const isFormData = data instanceof FormData;
        const config = isFormData ? {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        } : {};
        
        return apiClient.post(endpoint, data, config);
    },

    /**
     * Performs a PUT request.
     * @param {string} endpoint - The API endpoint to call.
     * @param {object} data - The data to send in the request body.
     * @returns {Promise<axios.AxiosResponse<any>>}
     */
    put: (endpoint, data) => {
        // Handle FormData for multipart requests
        const isFormData = data instanceof FormData;
        const config = isFormData ? {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        } : {};
        
        return apiClient.put(endpoint, data, config);
    },

    /**
     * Performs a DELETE request.
     * @param {string} endpoint - The API endpoint to call.
     * @returns {Promise<axios.AxiosResponse<any>>}
     */
    delete: (endpoint) => {
        return apiClient.delete(endpoint);
    },

    /**
     * Creates a new Axios instance with an authorization token.
     * This is useful for making requests to protected endpoints.
     * @param {string} token - The JWT or bearer token.
     * @returns {object} An API client instance with the authorization header set.
     */
    withToken: (token) => {
        const authedApiClient = axios.create({
            baseURL: API_BASE_URL,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        // Add interceptor for authenticated requests to handle 401 errors
        authedApiClient.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response && error.response.status === 401) {
                    handle401Error();
                }
                return Promise.reject(error);
            }
        );

        return {
            get: (endpoint, params = {}) => authedApiClient.get(endpoint, { params }),
            post: (endpoint, data) => {
                // Handle FormData for multipart requests
                const isFormData = data instanceof FormData;
                const config = isFormData ? {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    }
                } : {};
                
                return authedApiClient.post(endpoint, data, config);
            },
            put: (endpoint, data) => {
                // Handle FormData for multipart requests
                const isFormData = data instanceof FormData;
                const config = isFormData ? {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    }
                } : {};
                
                return authedApiClient.put(endpoint, data, config);
            },
            delete: (endpoint) => authedApiClient.delete(endpoint),
        };
    },
};

// --- Centralized Error Handling ---
// Intercept all responses to handle errors globally
apiClient.interceptors.response.use(
    (response) => response, // Any status code within 2xx cause this function to trigger
    (error) => {
        // Any status codes outside 2xx cause this function to trigger
        console.error('API Error:', error.response || error.message);
        
        // Handle 401 Unauthorized errors - redirect to login
        if (error.response && error.response.status === 401) {
            handle401Error();
        }

        return Promise.reject(error);
    }
);

export default api; 
/**
 * UPO UI - Global State Store
 * 
 * A lightweight, centralized state management system for the entire application.
 * It uses a simple event-driven (publish/subscribe) pattern.
 * 
 * HOW IT WORKS:
 * 1. A single 'state' object holds all global data.
 * 2. Components 'subscribe' to the store with a callback function.
 * 3. When 'setState' is called, the state is updated, and all subscribed callbacks are executed.
 * 4. Components can then re-render themselves with the new global state.
 * 
 * This allows distant components to share and react to state changes without
 * directly referencing each other.
 */

// --- The Global State ---
// All application-level state should be defined here.
const state = {
    currentUser: null, // Example: { name: 'John Doe', email: 'john@example.com' }
    isAuthenticated: false,
    theme: 'light', // Example: 'light' or 'dark'
    // Add other global state properties here...
};

// --- Subscribers ---
// A list of callback functions from subscribed components.
const subscribers = [];

// --- The Store Object ---
const store = {
    /**
     * Updates the global state and notifies all subscribers.
     * @param {object} newState - An object with the new state values to merge.
     */
    setState(newState) {
        // Merge the new state into the existing state
        Object.assign(state, newState);
        
        // Notify all subscribers about the change
        subscribers.forEach(callback => callback(state));
    },

    /**
     * Gets the current state.
     * @returns {object} The current global state.
     */
    getState() {
        return { ...state }; // Return a copy to prevent direct mutation
    },

    /**
     * Subscribes a component to state changes.
     * @param {function} callback - The function to call when the state changes.
     * @returns {function} An unsubscribe function to clean up the subscription.
     */
    subscribe(callback) {
        if (typeof callback !== 'function') {
            console.error('Subscription failed: callback must be a function.');
            return;
        }

        // Add the callback to the list of subscribers
        subscribers.push(callback);
        
        // Immediately call the callback with the current state to initialize the component
        callback(state); 

        // Return an 'unsubscribe' function for cleanup
        return () => {
            const index = subscribers.indexOf(callback);
            if (index > -1) {
                subscribers.splice(index, 1);
                console.log('Component unsubscribed from the store.');
            }
        };
    }
};

// Make the store globally accessible for easy debugging in the browser console
window.globalStore = store;

export default store; 
/**
 * UPO Component System - Ultra Minimal Framework
 * 
 * WHAT IT IS:
 * -----------
 * App is a base class that makes creating reactive web components super simple.
 * It's like a tiny React, but with zero dependencies and no build step required.
 * 
 * WHAT PROBLEM IT SOLVES:
 * ----------------------
 * 1. Manual DOM updates are tedious: document.querySelector().innerHTML = "..."
 * 2. State management is complex: tracking what changed and updating UI
 * 3. Component reusability is hard: copying/pasting HTML everywhere
 * 4. No reactivity: when data changes, UI doesn't update automatically
 * 
 * HOW IT WORKS:
 * ------------
 * 1. Extend App
 * 2. Override render() method to return HTML string
 * 3. Use set() to change data - UI updates automatically
 * 4. Use get() to read data
 * 
 * EXAMPLE:
 * -------
 * class Counter extends App {
 *     render() {
 *         return `<button onclick="this.parentElement.increment()">
 *                   Count: ${this.get('count') || 0}
 *                 </button>`;
 *     }
 *     
 *     increment() {
 *         this.set('count', (this.get('count') || 0) + 1);
 *         // UI updates automatically!
 *     }
 * }
 * 
 * customElements.define('my-counter', Counter);
 * 
 * // Usage in HTML:
 * <my-counter></my-counter>
 * 
 * BENEFITS:
 * --------
 * ✅ Zero dependencies - just JavaScript
 * ✅ No build step - works directly in browser
 * ✅ Reactive - data changes trigger UI updates
 * ✅ Simple - just override render() method
 * ✅ Chainable - this.set('a', 1).set('b', 2)
 * ✅ Familiar - uses standard Web Components API
 * ✅ Framework agnostic - works with any CSS framework
 */

// UPO Component System - Ultra Minimal
class App extends HTMLElement {
    constructor() {
        super();
        this.data = {};  // Internal state storage
    }
    
    /**
     * Set data and auto-update UI
     * @param {string} key - Data key
     * @param {any} value - Data value
     * @returns {App} - Returns this for chaining
     */
    set(key, value) {
        this.data[key] = value;
        // Auto-render if component is connected to DOM
        if (this.isConnected) this.innerHTML = this.render();
        return this; // Enable chaining: this.set('a', 1).set('b', 2)
    }
    
    /**
     * Get data value
     * @param {string} key - Data key
     * @returns {any} - Data value
     */
    get(key) {
        return this.data[key];
    }
    
    /**
     * OVERRIDE THIS METHOD in your components
     * @returns {string} - HTML string to render
     */
    render() {
        return '';
    }
    
    /**
     * Called when component is added to DOM
     * Loads dependencies and renders initial content
     */
    connectedCallback() {
        // Load UPO UI components bundle if not already loaded
        const bundleSrc = '/src/components/ui/bundle.js';
        let alreadyLoaded = false;
        document.querySelectorAll('script').forEach(s => {
            if (s.src.includes(bundleSrc)) {
                alreadyLoaded = true;
            }
        });

        if (!alreadyLoaded) {
            const script = document.createElement('script');
            script.type = 'module';
            // Add cache-busting parameter
            script.src = bundleSrc + '?v=' + Date.now();  // Absolute path from root
            
            // Add error handling for missing components
            script.onerror = () => {
                console.warn('UPO UI bundle could not be loaded, continuing without UI components');
            };
            
            document.head.appendChild(script);
        }
        
        // First render
        this.innerHTML = this.render();
    }
}

export default App; 
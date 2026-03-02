class Box extends HTMLElement {
    constructor() {
        super();
        
        // Create the div element directly (no shadow DOM)
        this.div = document.createElement('div');
        
        // Flag to prevent double processing
        this.initialized = false;
        
        // Add the div to the component
        this.appendChild(this.div);
        
        // Add default styles via CSS
        this.addDefaultStyles();
    }
    
    // Add default CSS styles to document if not already added
    addDefaultStyles() {
        if (!document.getElementById('upo-ui-box-styles')) {
            const style = document.createElement('style');
            style.id = 'upo-ui-box-styles';
            style.textContent = `
                .upo-box-default {
                    display: block;
                    padding: 1rem;
                    margin: 0;
                    border: 1px solid #e5e7eb;
                    border-radius: 0.375rem;
                    background-color: #ffffff;
                    box-sizing: border-box;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Connected callback - called when element is added to DOM
    connectedCallback() {
        // Prevent double processing
        if (this.initialized) return;
        this.initialized = true;
        
        // Move any existing children (except our div) to the internal div
        const children = Array.from(this.childNodes);
        children.forEach(child => {
            if (child !== this.div) {
                this.div.appendChild(child);
            }
        });
        
        // Use the getter for the default class
        if (!this.hasAttribute('class')) {
            this.div.className = this.defaultClass;
        }
        
        // Transfer all attributes to the internal div (same as Input)
        const attributes = this.getAttributeNames();
        
        attributes.forEach(attr => {
            const value = this.getAttribute(attr);
            if (attr === 'class' && this.hasAttribute('class')) {
                // Override default class with user classes
                this.div.className = value;
            } else {
                this.div.setAttribute(attr, value);
            }
        });
        
        // Remove all attributes from the wrapper to avoid duplication
        attributes.forEach(attr => {
            this.removeAttribute(attr);
        });
    }
    
    // Getter for the default class, allows child classes to override it
    get defaultClass() {
        return 'upo-box-default';
    }
    
    // Forward common methods to the internal div
    focus() {
        this.div.focus();
    }
    
    blur() {
        this.div.blur();
    }
    
    scrollIntoView(options) {
        this.div.scrollIntoView(options);
    }
}

    customElements.define('ui-box', Box);
export default Box; 
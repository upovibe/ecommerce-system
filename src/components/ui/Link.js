class Link extends HTMLElement {
    constructor() {
        super();
        
        // Create the anchor element directly (no shadow DOM)
        this.anchor = document.createElement('a');
        
        // Flag to prevent double processing
        this.initialized = false;
        
        // Add the anchor to the component
        this.appendChild(this.anchor);
        
        // Add default styles via CSS
        this.addDefaultStyles();
    }
    
    // Add default CSS styles to document if not already added
    addDefaultStyles() {
        if (!document.getElementById('upo-ui-link-styles')) {
            const style = document.createElement('style');
            style.id = 'upo-ui-link-styles';
            style.textContent = `
                .upo-link-default {
                    color: #3b82f6;
                    text-decoration: underline;
                    text-decoration-color: transparent;
                    transition: all 0.15s ease-in-out;
                    cursor: pointer;
                    outline: none;
                }
                .upo-link-default:hover {
                    color: #1d4ed8;
                    text-decoration-color: currentColor;
                }
                .upo-link-default:focus {
                    color: #1d4ed8;
                    text-decoration-color: currentColor;
                    outline: 2px solid #3b82f6;
                    outline-offset: 2px;
                }
                .upo-link-default:active {
                    color: #1e40af;
                }
                .upo-link-default:visited {
                    color: #7c3aed;
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
        
        // Move any existing children (except our anchor) to the internal anchor
        const children = Array.from(this.childNodes);
        children.forEach(child => {
            if (child !== this.anchor) {
                this.anchor.appendChild(child);
            }
        });
        
        // Check if user provided classes
        const hasUserClass = this.hasAttribute('class');
        
        // Apply default class if no user classes
        if (!hasUserClass) {
            this.anchor.className = 'upo-link-default';
        }
        
        // Transfer all attributes to the internal anchor (same as Input/Box)
        const attributes = this.getAttributeNames();
        
        attributes.forEach(attr => {
            const value = this.getAttribute(attr);
            if (attr === 'class' && hasUserClass) {
                // Override default class with user classes
                this.anchor.className = value;
            } else {
                this.anchor.setAttribute(attr, value);
            }
        });
        
        // Remove all attributes from the wrapper to avoid duplication
        attributes.forEach(attr => {
            this.removeAttribute(attr);
        });
    }
    
    // Forward common methods to the internal anchor
    focus() {
        this.anchor.focus();
    }
    
    blur() {
        this.anchor.blur();
    }
    
    click() {
        this.anchor.click();
    }
}

    customElements.define('ui-link', Link);
export default Link; 